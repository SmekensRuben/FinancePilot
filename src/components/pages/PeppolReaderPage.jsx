import React, { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import HeaderBar from "../layout/HeaderBar";
import PageContainer from "../layout/PageContainer";
import { auth, signOut } from "../../firebaseConfig";

function textContent(element) {
  return element?.textContent?.trim() || "-";
}

function findFirstByLocalName(root, localName) {
  if (!root) return null;
  return Array.from(root.getElementsByTagName("*")).find(
    (node) => node.localName === localName
  );
}

function findAllByLocalName(root, localName) {
  if (!root) return [];
  return Array.from(root.getElementsByTagName("*")).filter(
    (node) => node.localName === localName
  );
}

function parseUblInvoice(xmlText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "application/xml");
  const parserError = xmlDoc.querySelector("parsererror");

  if (parserError) {
    throw new Error("Het XML-bestand is ongeldig en kon niet gelezen worden.");
  }

  const invoiceNumber = textContent(findFirstByLocalName(xmlDoc, "ID"));
  const issueDate = textContent(findFirstByLocalName(xmlDoc, "IssueDate"));
  const dueDate = textContent(findFirstByLocalName(xmlDoc, "DueDate"));

  const supplierParty = findFirstByLocalName(xmlDoc, "AccountingSupplierParty");
  const customerParty = findFirstByLocalName(xmlDoc, "AccountingCustomerParty");

  const supplierName = textContent(findFirstByLocalName(supplierParty, "Name"));
  const customerName = textContent(findFirstByLocalName(customerParty, "Name"));

  const payables = findFirstByLocalName(xmlDoc, "LegalMonetaryTotal");
  const payableAmountNode = findFirstByLocalName(payables, "PayableAmount");
  const payableAmount = textContent(payableAmountNode);
  const currency = payableAmountNode?.getAttribute("currencyID") || "EUR";

  const invoiceLines = findAllByLocalName(xmlDoc, "InvoiceLine").map((line, index) => {
    const lineId = textContent(findFirstByLocalName(line, "ID"));
    const quantityNode = findFirstByLocalName(line, "InvoicedQuantity");
    const quantity = quantityNode?.textContent?.trim() || "-";
    const unit = quantityNode?.getAttribute("unitCode") || "";
    const lineAmount = textContent(findFirstByLocalName(line, "LineExtensionAmount"));
    const itemName = textContent(findFirstByLocalName(line, "Name"));

    return {
      index: index + 1,
      lineId,
      itemName,
      quantity: `${quantity}${unit ? ` ${unit}` : ""}`,
      lineAmount,
    };
  });

  return {
    invoiceNumber,
    issueDate,
    dueDate,
    supplierName,
    customerName,
    payableAmount,
    currency,
    invoiceLines,
  };
}

function generateInvoicePdf(invoice, originalFileName) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Peppol UBL factuur", 14, 18);

  doc.setFontSize(11);
  doc.text(`Bestand: ${originalFileName || "Onbekend"}`, 14, 28);
  doc.text(`Factuurnummer: ${invoice.invoiceNumber}`, 14, 36);
  doc.text(`Factuurdatum: ${invoice.issueDate}`, 14, 43);
  doc.text(`Vervaldatum: ${invoice.dueDate}`, 14, 50);
  doc.text(`Leverancier: ${invoice.supplierName}`, 14, 57);
  doc.text(`Klant: ${invoice.customerName}`, 14, 64);
  doc.text(
    `Totaal te betalen: ${invoice.payableAmount} ${invoice.currency}`,
    14,
    71
  );

  autoTable(doc, {
    startY: 80,
    head: [["#", "Lijn ID", "Omschrijving", "Aantal", "Lijnbedrag"]],
    body:
      invoice.invoiceLines.length > 0
        ? invoice.invoiceLines.map((line) => [
            String(line.index),
            line.lineId,
            line.itemName,
            line.quantity,
            `${line.lineAmount} ${invoice.currency}`,
          ])
        : [["-", "-", "Geen factuurlijnen gevonden", "-", "-"]],
    styles: {
      fontSize: 10,
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: [180, 31, 31],
    },
  });

  return doc;
}

export default function PeppolReaderPage() {
  const [selectedFileName, setSelectedFileName] = useState("");
  const [invoiceData, setInvoiceData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    []
  );

  const handleLogout = async () => {
    await signOut(auth);
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];

    setErrorMessage("");
    setInvoiceData(null);
    setSelectedFileName("");

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xml")) {
      setErrorMessage("Upload een XML-bestand in UBL/Peppol formaat.");
      return;
    }

    try {
      const xmlText = await file.text();
      const parsedInvoice = parseUblInvoice(xmlText);
      setInvoiceData(parsedInvoice);
      setSelectedFileName(file.name);
    } catch (error) {
      setErrorMessage(error.message || "Kon het bestand niet verwerken.");
    }
  };

  const handleDownloadPdf = () => {
    if (!invoiceData) return;

    const pdfDocument = generateInvoicePdf(invoiceData, selectedFileName);
    const fileBaseName = selectedFileName.replace(/\.xml$/i, "") || "peppol-factuur";
    pdfDocument.save(`${fileBaseName}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <HeaderBar today={todayLabel} onLogout={handleLogout} />
      <PageContainer>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[#b41f1f]">Peppol-Reader</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Upload een UBL-factuur (XML) en genereer een downloadbare PDF.
          </p>

          <div className="mt-6">
            <label
              htmlFor="ubl-upload"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Selecteer UBL XML-bestand
            </label>
            <input
              id="ubl-upload"
              type="file"
              accept=".xml,text/xml,application/xml"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg p-2 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-[#b41f1f] file:text-white file:font-semibold hover:file:bg-[#921818]"
            />
          </div>

          {selectedFileName && (
            <p className="mt-4 text-sm text-gray-700">
              Geselecteerd bestand: <span className="font-semibold">{selectedFileName}</span>
            </p>
          )}

          {errorMessage && (
            <p className="mt-4 text-sm font-semibold text-red-600">{errorMessage}</p>
          )}

          {invoiceData && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">Factuurnummer:</span> {invoiceData.invoiceNumber}
                </p>
                <p>
                  <span className="font-semibold">Factuurdatum:</span> {invoiceData.issueDate}
                </p>
                <p>
                  <span className="font-semibold">Leverancier:</span> {invoiceData.supplierName}
                </p>
                <p>
                  <span className="font-semibold">Klant:</span> {invoiceData.customerName}
                </p>
                <p>
                  <span className="font-semibold">Totaal:</span> {invoiceData.payableAmount} {invoiceData.currency}
                </p>
                <p>
                  <span className="font-semibold">Factuurlijnen:</span> {invoiceData.invoiceLines.length}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadPdf}
                className="bg-[#b41f1f] hover:bg-[#921818] text-white font-semibold px-4 py-2 rounded-lg"
              >
                Download PDF
              </button>
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
