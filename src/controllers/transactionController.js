const Consultation = require('../models/Consultation');
const MedicineOrder = require('../models/MedicineOrder');

// @desc    Get all transactions for a patient (Consultations & Medicine Orders)
// @route   GET /api/transactions/patient
// @access  Private (Patient only)
exports.getPatientTransactions = async (req, res) => {
    try {
        const patientId = req.user.id;

        // 1. Fetch Consultations (Paid or Completed)
        // We consider 'upcoming' as well if they are paid.
        const consultations = await Consultation.find({
            patientId,
            paymentStatus: { $in: ['paid', 'refunded'] },
            isArchived: { $ne: true }
        })
            .populate('doctorId', 'name email') // Fallback if doctorName is missing
            .lean();

        // 2. Fetch Medicine Orders (Paid or Delivered)
        const medicineOrders = await MedicineOrder.find({
            patientId,
            paymentStatus: { $in: ['paid', 'refunded'] },
            isArchived: { $ne: true }
        })
            .populate('pharmacyId', 'fullName email profileImage')
            .lean();

        // 3. Normalize Data
        const normalizedConsultations = consultations.map(c => ({
            id: c._id,
            date: c.date || c.createdAt, // Consultation date or creation date
            type: 'consultation',
            subType: c.type, // video, audio, chat
            amount: c.fee,
            status: c.paymentStatus,
            paymentMethod: c.paymentMethod,
            referenceName: c.doctorName || (c.doctorId ? `Dr. ${c.doctorId.name}` : 'Doctor'),
            referenceImage: c.doctorImage,
            details: {
                specialty: c.specialty,
                time: c.time,
                status: c.status // consultation status (upcoming, completed, etc)
            },
            invoiceReady: true // Can generate invoice
        }));

        const normalizedOrders = medicineOrders.map(o => ({
            id: o._id,
            date: o.paidAt || o.createdAt,
            type: 'medicine_order',
            subType: 'ecommerce',
            amount: o.totalAmount,
            status: o.paymentStatus,
            paymentMethod: o.paymentMethod, // esewa, khalti
            referenceName: o.pharmacyId?.fullName || 'Pharmacy',
            referenceImage: o.pharmacyId?.profileImage,
            details: {
                itemCount: o.medicines.length,
                deliveryStatus: o.status // order status (preparing, delivered, etc)
            },
            invoiceData: {
                subtotal: o.subtotal,
                deliveryCharges: o.deliveryCharges,
                discountAmount: o.discountAmount,
                promoCode: o.promoCode,
                items: o.medicines,
                deliveryAddress: o.deliveryAddress
            },
            invoiceReady: true
        }));

        // 4. Merge and Sort (Newest first)
        const allTransactions = [...normalizedConsultations, ...normalizedOrders].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });

        res.json({
            success: true,
            count: allTransactions.length,
            data: allTransactions
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error fetching transactions'
        });
    }
};

// @desc    Archive (Delete) a transaction
// @route   DELETE /api/transactions/:id
// @access  Private (Patient only)
exports.deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query; // 'consultation' or 'medicine_order'
        const patientId = req.user.id;

        if (!type || !id) {
            return res.status(400).json({ success: false, message: 'Transaction ID and type are required' });
        }

        let result;

        if (type === 'consultation') {
            result = await Consultation.findOneAndUpdate(
                { _id: id, patientId },
                { isArchived: true },
                { new: true }
            );
        } else if (type === 'medicine_order') {
            result = await MedicineOrder.findOneAndUpdate(
                { _id: id, patientId },
                { isArchived: true },
                { new: true }
            );
        } else {
            return res.status(400).json({ success: false, message: 'Invalid transaction type' });
        }

        if (!result) {
            return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized' });
        }

        res.json({ success: true, message: 'Transaction removed from history' });

    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ success: false, message: 'Server Error deleting transaction' });
    }
};

// @desc    Download Transaction Invoice PDF
// @route   GET /api/transactions/:id/invoice
// @access  Private (Patient only)
exports.downloadTransactionInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query; // 'consultation' or 'medicine_order'
        const patientId = req.user.id;
        const PDFDocument = require('pdfkit');

        let transaction;
        let invoiceData = {};

        if (type === 'consultation') {
            transaction = await Consultation.findOne({ _id: id, patientId }).populate('doctorId', 'name email');
            if (transaction) {
                invoiceData = {
                    id: transaction._id,
                    date: transaction.date,
                    billedFrom: transaction.doctorName || `Dr. ${transaction.doctorId.name}`,
                    billedTo: req.user.name,
                    items: [{
                        description: `${transaction.specialty} Consultation (${transaction.type})`,
                        quantity: 1,
                        amount: transaction.fee
                    }],
                    total: transaction.fee,
                    status: transaction.paymentStatus,
                    paymentMethod: transaction.paymentMethod
                };
            }
        } else if (type === 'medicine_order') {
            transaction = await MedicineOrder.findOne({ _id: id, patientId }).populate('pharmacyId', 'fullName email');
            if (transaction) {
                invoiceData = {
                    id: transaction._id,
                    date: transaction.createdAt,
                    billedFrom: transaction.pharmacyId?.fullName || 'Swasthya Pharmacy',
                    billedTo: req.user.name,
                    billingAddress: transaction.deliveryAddress,
                    items: transaction.medicines.map(m => ({
                        description: `${m.name} (${m.dosage})`,
                        quantity: m.quantity,
                        amount: m.totalPrice
                    })),
                    subtotal: transaction.subtotal,
                    delivery: transaction.deliveryCharges,
                    discount: transaction.discountAmount,
                    total: transaction.totalAmount,
                    status: transaction.paymentStatus,
                    paymentMethod: transaction.paymentMethod
                };
            }
        }

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        // Initialize PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        // Set headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceData.id}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#7c3aed').text('INVOICE', { align: 'right' });
        doc.fontSize(10).font('Helvetica').fillColor('#6b7280').text(`#${String(invoiceData.id).slice(-8).toUpperCase()}`, { align: 'right' });
        doc.text(new Date(invoiceData.date).toLocaleDateString(), { align: 'right' });
        doc.moveDown();

        // Logo Check (You might want to add a real logo path if exists, skipping for now to avoid errors)
        doc.fontSize(16).fillColor('#111827').text('Swasthya Connect', 50, 50);

        doc.moveDown(3);

        // Billed From / To
        const topY = doc.y;
        doc.fontSize(10).fillColor('#9ca3af').text('BILLED FROM', 50, topY);
        doc.fontSize(12).fillColor('#1f2937').font('Helvetica-Bold').text(invoiceData.billedFrom, 50, topY + 15);
        doc.fontSize(10).font('Helvetica').text('Swasthya Connect Platform', 50, topY + 30);

        doc.fontSize(10).fillColor('#9ca3af').text('BILLED TO', 300, topY);
        doc.fontSize(12).fillColor('#1f2937').font('Helvetica-Bold').text(invoiceData.billedTo, 300, topY + 15);

        if (invoiceData.billingAddress) {
            doc.fontSize(10).font('Helvetica').text(invoiceData.billingAddress, 300, topY + 30);
        }

        doc.fontSize(10).font('Helvetica').text(`Payment: ${invoiceData.paymentMethod || 'Online'}`, 300, invoiceData.billingAddress ? topY + 45 : topY + 30);

        doc.moveDown(4);

        // Table Header
        const tableTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b7280');
        doc.text('DESCRIPTION', 50, tableTop);
        doc.text('QTY', 350, tableTop, { width: 50, align: 'right' });
        doc.text('AMOUNT', 450, tableTop, { width: 90, align: 'right' });

        // Divider
        doc.moveTo(50, tableTop + 15).lineTo(540, tableTop + 15).strokeColor('#e5e7eb').stroke();

        let rowY = tableTop + 25;

        // Items
        doc.font('Helvetica').fillColor('#1f2937');
        invoiceData.items.forEach(item => {
            doc.text(item.description, 50, rowY);
            doc.text(item.quantity.toString(), 350, rowY, { width: 50, align: 'right' });
            doc.text(`NPR ${item.amount.toLocaleString()}`, 450, rowY, { width: 90, align: 'right' });

            rowY += 20;
            // Divider per row
            doc.moveTo(50, rowY - 5).lineTo(540, rowY - 5).strokeColor('#f3f4f6').stroke();
        });

        rowY += 10;

        // Totals
        const totalsX = 350;
        doc.font('Helvetica');

        if (type === 'medicine_order') {
            doc.text('Subtotal', totalsX, rowY);
            doc.text(`NPR ${invoiceData.subtotal.toLocaleString()}`, 450, rowY, { width: 90, align: 'right' });
            rowY += 20;

            doc.text('Delivery', totalsX, rowY);
            doc.text(`NPR ${invoiceData.delivery.toLocaleString()}`, 450, rowY, { width: 90, align: 'right' });
            rowY += 20;

            if (invoiceData.discount > 0) {
                doc.fillColor('#dc2626').text('Discount', totalsX, rowY);
                doc.text(`- NPR ${invoiceData.discount.toLocaleString()}`, 450, rowY, { width: 90, align: 'right' });
                rowY += 20;
            }
        }

        // Grand Total
        doc.moveTo(totalsX, rowY).lineTo(540, rowY).strokeColor('#e5e7eb').lineWidth(2).stroke();
        rowY += 10;

        doc.fontSize(14).font('Helvetica-Bold').fillColor('#7c3aed');
        doc.text('Total', totalsX, rowY);
        doc.text(`NPR ${invoiceData.total.toLocaleString()}`, 450, rowY, { width: 90, align: 'right' });

        // Footer
        doc.fontSize(10).font('Helvetica').fillColor('#9ca3af').text('Thank you for trusting Swasthya Connect.', 50, 700, { align: 'center', width: 500 });
        doc.text('This is a computer-generated invoice.', 50, 715, { align: 'center', width: 500 });

        doc.end();

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ success: false, message: 'Server Error generating PDF' });
    }
};
