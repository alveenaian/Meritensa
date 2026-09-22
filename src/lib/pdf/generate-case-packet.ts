import PDFDocument from "pdfkit";
import { db } from "~/server/db";
import { BRAND } from "~/lib/config/brand";

export async function generateCasePacketPDF(caseId: string): Promise<Buffer> {
  const caseData = await db.case.findUnique({
    where: { id: caseId },
    include: {
      user: true,
      documents: {
        where: { caseId: caseId },
      },
      causesOfAction: {
        where: { caseId: caseId },
      },
      messages: {
        where: { 
          caseId: caseId,
          role: "ASSISTANT" 
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!caseData) throw new Error("Case not found");

  // Validation
  const invalidDocuments = caseData.documents.filter(d => d.caseId !== caseId);
  const invalidCauses = caseData.causesOfAction.filter(c => c.caseId !== caseId);
  const invalidMessages = caseData.messages.filter(m => m.caseId !== caseId);

  if (invalidDocuments.length > 0 || invalidCauses.length > 0 || invalidMessages.length > 0) {
    throw new Error("Data integrity violation in PDF generation");
  }

  // Extract data from consolidated fields
  const analysisResults = (caseData.analysisResults as any) || {};
  const summary = analysisResults.caseSummary || caseData.summary;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc
      .fontSize(10)
      .fillColor("#666")
      .text(`PREPARED BY ${BRAND.name.toUpperCase()}`, { align: "right" });
    doc.text(`Case ID: ${caseData.id}`, { align: "right" });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, {
      align: "right",
    });

    doc.moveDown(2);

    // Title
    doc
      .fontSize(24)
      .fillColor("#1a365d")
      .text("Case Intake Packet", { align: "center" });

    doc.moveDown();
    doc
      .fontSize(16)
      .fillColor("#333")
      .text(caseData.title, { align: "center" });

    doc.moveDown(2);

    // Case Overview
    doc.fontSize(14).fillColor("#1a365d").text("CASE OVERVIEW");
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#333");
    doc.text(`Case Type: ${caseData.caseType.replace(/_/g, " ")}`);
    doc.text(`Jurisdiction: ${caseData.state || caseData.incidentState || "Not specified"}`);
    doc.text(`Defendant: ${caseData.defendantName || "Not specified"}`);
    doc.text(`Defendant Type: ${caseData.defendantType || "Not specified"}`);
    if (caseData.incidentDate) {
      doc.text(`Incident Date: ${caseData.incidentDate.toLocaleDateString()}`);
    }
    if (caseData.solDeadline) {
      doc.text(`SOL Deadline: ${caseData.solDeadline.toLocaleDateString()}`);
    }

    doc.moveDown(2);

    // Case Score
    if (caseData.overallScore !== null) {
      doc.fontSize(14).fillColor("#1a365d").text("CASE SCORE");
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor("#333");
      doc.text(`Overall Score: ${caseData.overallScore}/100`);
      if (caseData.evidenceScore)
        doc.text(`Evidence Strength: ${caseData.evidenceScore}/100`);
      if (caseData.liabilityScore)
        doc.text(`Liability Clarity: ${caseData.liabilityScore}/100`);
      if (caseData.damagesScore)
        doc.text(`Damages Quantifiability: ${caseData.damagesScore}/100`);
      if (caseData.collectability)
        doc.text(`Defendant Collectability: ${caseData.collectability}/100`);
      if (caseData.solRisk) doc.text(`SOL Risk: ${caseData.solRisk}`);
      doc.moveDown(2);
    }

    // Estimated Damages
    if (caseData.estimatedDamages || caseData.damagesDescription) {
      doc.fontSize(14).fillColor("#1a365d").text("ESTIMATED DAMAGES");
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor("#333");
      doc.text(
        caseData.damagesDescription ||
          `$${caseData.estimatedDamages?.toLocaleString()}`
      );
      doc.moveDown(2);
    }

    // Causes of Action
    if (caseData.causesOfAction.length > 0) {
      doc.fontSize(14).fillColor("#1a365d").text("IDENTIFIED CAUSES OF ACTION");
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor("#333");
      caseData.causesOfAction.forEach((coa, i) => {
        doc.text(`${i + 1}. ${coa.name} — Strength: ${coa.strength}%`);
        if (coa.description) {
          doc.fontSize(10).fillColor("#666").text(`   ${coa.description}`);
          doc.fontSize(11).fillColor("#333");
        }
      });
      doc.moveDown(2);
    }

    // Case Summary
    if (summary) {
      doc.fontSize(14).fillColor("#1a365d").text("CASE SUMMARY");
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor("#333");
      doc.text(summary, { align: "justify" });
      doc.moveDown(2);
    }

    // Documents List
    if (caseData.documents.length > 0) {
      doc.fontSize(14).fillColor("#1a365d").text("UPLOADED EVIDENCE");
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor("#333");
      caseData.documents.forEach((docItem, i) => {
        doc.text(`${i + 1}. ${docItem.originalName} (${docItem.category})`);
        if (docItem.aiSummary) {
          doc
            .fontSize(10)
            .fillColor("#666")
            .text(`   Summary: ${docItem.aiSummary}`);
          doc.fontSize(11).fillColor("#333");
        }
      });
      doc.moveDown(2);
    }

    // Pro Analysis sections (if available)
    const proResults = (caseData.proAnalysisResults as any) || {};
    if (proResults.executiveSummary) {
      doc.addPage();
      doc.fontSize(18).fillColor("#1a365d").text("ATTORNEY-READY ANALYSIS");
      doc.moveDown(1);

      // Executive Summary
      doc.fontSize(14).fillColor("#1a365d").text("EXECUTIVE SUMMARY");
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#333");
      const execSummary = proResults.executiveSummary
        .replace(/\*\*/g, "")
        .replace(/#{1,6}\s/g, "")
        .substring(0, 2000);
      doc.text(execSummary, { align: "justify" });
      doc.moveDown(2);

      // Note about full packet
      doc.fontSize(10).fillColor("#666");
      doc.text(
        "Note: This summary packet includes basic case information. The complete Attorney-Ready Packet with adversarial liability analysis, SOL defense strategy, damages memo, and risk register is available separately.",
        { align: "justify" }
      );
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(9).fillColor("#999");
    doc.text("─".repeat(70));
    doc.text(
      `This case packet was prepared using ${BRAND.name} — The Plaintiff Operating System`
    );
    doc.text("For law firm partnership inquiries: partners@kairav.ai");
    doc.text("");
    doc.text(
      "DISCLAIMER: This document contains AI-generated analysis and should not be considered legal advice."
    );

    doc.end();
  });
}

export async function generateOnePagerPDF(caseId: string): Promise<Buffer> {
  const caseData = await db.case.findUnique({
    where: { id: caseId },
    include: {
      user: true,
    },
  });

  if (!caseData) throw new Error("Case not found");

  const proResults = (caseData.proAnalysisResults as any) || {};
  const intakeData = (caseData.intakeFormData as any) || {};

  if (!proResults.executiveSummary) {
    throw new Error("Pro analysis must be generated before creating one-pager");
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "LETTER" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc
      .fontSize(8)
      .fillColor("#666")
      .text("ATTORNEY CASE REVIEW — ONE-PAGE EXECUTIVE SUMMARY", { align: "center" });
    doc.moveDown(0.3);
    doc
      .fontSize(7)
      .text(`Prepared by ${BRAND.name} | Case ID: ${caseData.id} | ${new Date().toLocaleDateString()}`, {
        align: "center",
      });

    doc.moveDown(1);

    // Title
    doc
      .fontSize(16)
      .fillColor("#1a365d")
      .font("Helvetica-Bold")
      .text(caseData.title.toUpperCase(), { align: "center" });

    doc.moveDown(0.5);

    // Case Type and Jurisdiction
    doc
      .fontSize(10)
      .fillColor("#333")
      .font("Helvetica")
      .text(
        `${caseData.caseType.replace(/_/g, " ")} | ${caseData.state || caseData.incidentState || "Jurisdiction TBD"}`,
        { align: "center" }
      );

    doc.moveDown(1);

    // Key Facts Box
    doc.rect(50, doc.y, 495, 80).fillAndStroke("#f8f9fa", "#dee2e6");
    const boxStartY = doc.y + 10;
    doc.fillColor("#333");

    doc.fontSize(9).font("Helvetica-Bold").text("DEFENDANT:", 60, boxStartY);
    doc
      .font("Helvetica")
      .text(
        `${caseData.defendantName || "TBD"} (${caseData.defendantType || "Type TBD"})`,
        160,
        boxStartY
      );

    doc.font("Helvetica-Bold").text("INCIDENT DATE:", 60, boxStartY + 15);
    doc
      .font("Helvetica")
      .text(
        caseData.incidentDate
          ? caseData.incidentDate.toLocaleDateString()
          : "TBD",
        160,
        boxStartY + 15
      );

    doc.font("Helvetica-Bold").text("DAMAGES RANGE:", 60, boxStartY + 30);
    const damagesText = intakeData.damagesTotal
      ? `$${parseFloat(intakeData.damagesTotal).toLocaleString()}`
      : caseData.estimatedDamages
      ? `$${caseData.estimatedDamages.toLocaleString()}`
      : "TBD";
    doc.font("Helvetica").text(damagesText, 160, boxStartY + 30);

    doc.font("Helvetica-Bold").text("SOL DEADLINE:", 60, boxStartY + 45);
    doc
      .font("Helvetica")
      .text(
        caseData.solDeadline
          ? caseData.solDeadline.toLocaleDateString()
          : "Under review",
        160,
        boxStartY + 45
      );

    if (caseData.overallScore) {
      doc.font("Helvetica-Bold").text("CASE SCORE:", 60, boxStartY + 60);
      doc
        .font("Helvetica")
        .text(`${caseData.overallScore}/100`, 160, boxStartY + 60);
    }

    doc.y = boxStartY + 85;
    doc.moveDown(1);

    // Executive Summary
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#1a365d")
      .text("EXECUTIVE SUMMARY");
    doc.moveDown(0.3);

    // Parse and render the executive summary (remove markdown formatting for PDF)
    const summaryText = proResults.executiveSummary
      .replace(/\*\*/g, "") // Remove bold markers
      .replace(/#{1,6}\s/g, "") // Remove headers
      .replace(/\n\n/g, "\n"); // Reduce spacing

    doc
      .fontSize(9)
      .fillColor("#333")
      .font("Helvetica")
      .text(summaryText, {
        align: "justify",
        lineGap: 2,
      });

    doc.moveDown(1);

    // Footer
    doc.fontSize(7).fillColor("#999");
    doc.text("─".repeat(90), { align: "center" });
    doc.text(
      `This one-page summary is part of a complete attorney-ready case packet prepared using ${BRAND.name}`,
      { align: "center" }
    );
    doc.text("For the full analysis packet, see accompanying documents", {
      align: "center",
    });
    doc.moveDown(0.3);
    doc.text(
      "DISCLAIMER: This document contains AI-generated analysis and should not be considered legal advice.",
      { align: "center" }
    );

    doc.end();
  });
}
