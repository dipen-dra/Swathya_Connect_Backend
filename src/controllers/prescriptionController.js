const Prescription = require('../models/Prescription');
const Consultation = require('../models/Consultation');
const User = require('../models/User');
const Profile = require('../models/Profile');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// @desc    Create prescription
// @route   POST /api/prescriptions/create
// @access  Private (Doctor only)
exports.createPrescription = async (req, res) => {
    try {
        const { consultationId, medicines, diagnosis, additionalNotes } = req.body;

        // Verify consultation exists and is completed
        const consultation = await Consultation.findById(consultationId);
        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }

        if (consultation.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Can only create prescription for completed consultations'
            });
        }

        // Verify doctor is the one who handled the consultation
        if (consultation.doctorId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to create prescription for this consultation'
            });
        }

        // Check if prescription already exists
        const existingPrescription = await Prescription.findOne({ consultationId });
        if (existingPrescription) {
            return res.status(400).json({
                success: false,
                message: 'Prescription already exists for this consultation. Use update instead.'
            });
        }

        // Create prescription
        const prescription = await Prescription.create({
            consultationId,
            doctorId: req.user.id,
            patientId: consultation.patientId,
            medicines,
            diagnosis,
            additionalNotes
        });

        // Update consultation with prescription ID
        consultation.prescriptionId = prescription._id;
        await consultation.save();

        res.status(201).json({
            success: true,
            data: prescription
        });
    } catch (error) {
        console.error('Error creating prescription:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get prescription by consultation ID
// @route   GET /api/prescriptions/consultation/:consultationId
// @access  Private
exports.getPrescriptionByConsultation = async (req, res) => {
    try {
        const prescription = await Prescription.findOne({
            consultationId: req.params.consultationId
        })
            .populate('doctorId', 'name email')
            .populate('patientId', 'name email');

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found'
            });
        }

        // Verify user is either the doctor or patient
        if (prescription.doctorId._id.toString() !== req.user.id &&
            prescription.patientId._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this prescription'
            });
        }

        res.status(200).json({
            success: true,
            data: prescription
        });
    } catch (error) {
        console.error('Error getting prescription:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
// @access  Private (Doctor only)
exports.updatePrescription = async (req, res) => {
    try {
        const { medicines, diagnosis, additionalNotes } = req.body;

        let prescription = await Prescription.findById(req.params.id);

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found'
            });
        }

        // Verify doctor owns this prescription
        if (prescription.doctorId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this prescription'
            });
        }

        // Update fields
        if (medicines) prescription.medicines = medicines;
        if (diagnosis !== undefined) prescription.diagnosis = diagnosis;
        if (additionalNotes !== undefined) prescription.additionalNotes = additionalNotes;

        await prescription.save();

        res.status(200).json({
            success: true,
            data: prescription
        });
    } catch (error) {
        console.error('Error updating prescription:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Generate and download prescription PDF
// @route   GET /api/prescriptions/:id/pdf
// @access  Private
exports.generatePrescriptionPDF = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id)
            .populate('consultationId')
            .populate('doctorId', 'name email')
            .populate('patientId', 'name email');

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found'
            });
        }

        // Verify user is either the doctor or patient
        if (prescription.doctorId._id.toString() !== req.user.id &&
            prescription.patientId._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to download this prescription'
            });
        }

        // Get doctor and patient profiles
        const doctorProfile = await Profile.findOne({ userId: prescription.doctorId._id });
        const patientProfile = await Profile.findOne({ userId: prescription.patientId._id });

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=prescription-${prescription._id}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('SWASTHYA CONNECT', { align: 'center' });
        doc.fontSize(14).font('Helvetica').text('Digital Prescription', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`, { align: 'right' });
        doc.moveDown();

        // Line separator
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Doctor Information
        doc.fontSize(12).font('Helvetica-Bold').text('DOCTOR INFORMATION');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Dr. ${doctorProfile?.firstName || ''} ${doctorProfile?.lastName || prescription.doctorId.name}`);
        doc.text(`Specialty: ${doctorProfile?.specialty || 'General Physician'}`);
        doc.text(`License: ${doctorProfile?.licenseNumber || 'N/A'}`);
        doc.text(`Contact: ${doctorProfile?.phoneNumber || prescription.doctorId.email}`);
        doc.moveDown();

        // Line separator
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Patient Information
        doc.fontSize(12).font('Helvetica-Bold').text('PATIENT INFORMATION');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Name: ${patientProfile?.firstName || ''} ${patientProfile?.lastName || prescription.patientId.name}`);

        const age = patientProfile?.dateOfBirth
            ? Math.floor((new Date() - new Date(patientProfile.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
            : 'N/A';
        doc.text(`Age: ${age} | Gender: ${patientProfile?.gender || 'N/A'}`);
        doc.text(`Consultation Date: ${new Date(prescription.consultationId.createdAt).toLocaleDateString()}`);
        doc.moveDown();

        // Line separator
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Diagnosis
        if (prescription.diagnosis) {
            doc.fontSize(12).font('Helvetica-Bold').text('DIAGNOSIS');
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica').text(prescription.diagnosis);
            doc.moveDown();

            // Line separator
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();
        }

        // Prescription (Medicines)
        doc.fontSize(12).font('Helvetica-Bold').text('PRESCRIPTION');
        doc.moveDown();

        prescription.medicines.forEach((medicine, index) => {
            doc.fontSize(10).font('Helvetica-Bold').text(`${index + 1}. ${medicine.name}`);
            doc.fontSize(9).font('Helvetica');
            doc.text(`   Dosage: ${medicine.dosage}`);
            doc.text(`   Frequency: ${medicine.frequency}`);
            doc.text(`   Duration: ${medicine.duration}`);
            if (medicine.instructions) {
                doc.text(`   Instructions: ${medicine.instructions}`);
            }
            doc.moveDown(0.5);
        });

        doc.moveDown();

        // Line separator
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Additional Notes
        if (prescription.additionalNotes) {
            doc.fontSize(12).font('Helvetica-Bold').text('ADDITIONAL NOTES');
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica').text(prescription.additionalNotes);
            doc.moveDown();

            // Line separator
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();
        }

        // Signature
        doc.moveDown(2);
        doc.fontSize(10).font('Helvetica').text(`Doctor's Signature: _____________________`);
        doc.text(`Date: ${new Date().toLocaleDateString()}`);
        doc.moveDown(2);

        // Footer
        doc.fontSize(8).font('Helvetica-Oblique').text(
            'This is a digitally generated prescription from Swasthya Connect',
            { align: 'center' }
        );

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
