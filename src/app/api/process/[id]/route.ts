export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import Groq from "groq-sdk";

const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function processQuery(queryId: string) {
    try {
        const query = await prisma.searchQuery.findUnique({ where: { id: queryId } });
        if (!query) return;

        // 1. Fetch from OpenAlex
        const openAlexUrl = `https://api.openalex.org/works?search=${encodeURIComponent(query.topic)}&filter=publication_year:${query.yearStart}-${query.yearEnd},has_doi:true&per-page=3&mailto=${process.env.OPENALEX_EMAIL}`;
        const alexRes = await fetch(openAlexUrl);
        const alexData = await alexRes.json();

        const works = alexData.results || [];
        if (works.length === 0) {
            await prisma.searchQuery.update({ where: { id: queryId }, data: { status: "COMPLETED" } });
            return;
        }

        // Process each paper
        for (const work of works) {
            const doiUrl = work.doi;
            const doi = doiUrl.replace("https://doi.org/", "");

            let pdfUrl = work.open_access?.oa_url;

            // 2. Unpaywall Check (Fallback)
            if (!pdfUrl) {
                try {
                    const unpaywallRes = await fetch(`https://api.unpaywall.org/v2/${doi}?email=${process.env.UNPAYWALL_EMAIL}`);
                    const unpaywallData = await unpaywallRes.json();
                    pdfUrl = unpaywallData.best_oa_location?.url_for_pdf;
                } catch (e) {
                    console.error("Unpaywall fetch failed for", doi);
                }
            }

            const paper = await prisma.paper.create({
                data: {
                    searchQueryId: queryId,
                    title: work.title || "Unknown Title",
                    authors: work.authorships?.map((a: any) => a.author.display_name).join(", ") || "",
                    url: pdfUrl || doiUrl,
                    doi: doi,
                    abstract: work.abstract_inverted_index ? "Abstract available but abbreviated." : "No abstract",
                }
            });

            if (pdfUrl) {
                try {
                    // 3. Download PDF
                    const pdfRes = await fetch(pdfUrl);
                    if (pdfRes.ok) {
                        const arrayBuffer = await pdfRes.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);

                        // Upload to R2
                        const fileKey = `${queryId}/${paper.id}.pdf`;
                        await s3Client.send(new PutObjectCommand({
                            Bucket: process.env.R2_BUCKET_NAME,
                            Key: fileKey,
                            Body: buffer,
                            ContentType: "application/pdf"
                        }));

                        await prisma.paper.update({ where: { id: paper.id }, data: { pdfStorageKey: fileKey, isDownloaded: true } });

                        // 4. Extract text
                        const pdfParseModule = await import("pdf-parse");
                        const pdfParse = (pdfParseModule as any).default || pdfParseModule;
                        const pdfData = await pdfParse(buffer);
                        const textToAnalyze = pdfData.text.substring(0, 10000); // limit to 10k chars for fast Groq processing

                        // 5. AI Synthesis using Groq
                        const prompt = `
            Analyze this research paper excerpt and extract the following in strict JSON format:
            {
              "strengths": "Brief bullet points of the paper's strengths.",
              "futureWork": "What future work does the paper suggest?",
              "aiSummary": "A 3-sentence summary of the paper's main contributions."
            }
            Text:
            ${textToAnalyze}
            `;

                        const completion = await groq.chat.completions.create({
                            messages: [{ role: "user", content: prompt }],
                            model: "llama-3.1-8b-instant",
                            temperature: 0.2,
                            response_format: { type: "json_object" }
                        });

                        const aiResponse = JSON.parse(completion.choices[0]?.message?.content || "{}");

                        await prisma.literatureReview.create({
                            data: {
                                paperId: paper.id,
                                strengths: aiResponse.strengths || "N/A",
                                futureWork: aiResponse.futureWork || "N/A",
                                aiSummary: aiResponse.aiSummary || "N/A"
                            }
                        });
                    }
                } catch (downloadErr) {
                    console.error("PDF Processing failed for", paper.id, downloadErr);
                }
            }
        }

        await prisma.searchQuery.update({ where: { id: queryId }, data: { status: "COMPLETED" } });

    } catch (err) {
        console.error("Processing Pipeline Error:", err);
        await prisma.searchQuery.update({ where: { id: queryId }, data: { status: "FAILED" } }).catch(console.error);
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const query = await prisma.searchQuery.findUnique({ where: { id: resolvedParams.id } });

    if (!query || query.status !== "PENDING") {
        return NextResponse.json({ message: "Invalid or already processing" }, { status: 400 });
    }

    // Mark as PROCESSING
    await prisma.searchQuery.update({
        where: { id: resolvedParams.id },
        data: { status: "PROCESSING" }
    });

    // Start background processing (void)
    processQuery(resolvedParams.id);

    return NextResponse.json({ status: "PROCESSING" });
}
