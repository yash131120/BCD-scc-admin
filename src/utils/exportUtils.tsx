import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import * as QRCodeReact from 'qrcode.react';
import React from 'react';

export const exportToPNG = async (element: HTMLElement, filename: string) => {
  try {
    const dataUrl = await toPng(element, {
      quality: 1.0,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error exporting PNG:', error);
    alert('Failed to export PNG. Please try again.');
  }
};

export const exportToPDF = async (element: HTMLElement, filename: string) => {
  try {
    const dataUrl = await toPng(element, {
      quality: 1.0,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    const imgWidth = 85; // Business card width in mm
    const imgHeight = 54; // Business card height in mm
    const x = (pdf.internal.pageSize.getWidth() - imgWidth) / 2;
    const y = 30;
    
    pdf.addImage(dataUrl, 'PNG', x, y, imgWidth, imgHeight);
    pdf.save(filename);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Failed to export PDF. Please try again.');
  }
};

export const generateQRCode = (url: string) => {
  return (
    <QRCodeReact.QRCode
      value={url}
      size={200}
      level="M"
      includeMargin={true}
      renderAs="svg"
    />
  );
};