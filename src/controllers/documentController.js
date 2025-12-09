const DoctorDocument = require('../models/DoctorDocument');
const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');

// @desc    Upload document
// @route   POST /api/documents/upload
// @access  Private (Doctor only)
exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        const { documentType, documentName, notes } = req.body;

        const document = await DoctorDocument.create({
            doctorId: req.user.id,
            documentType,
            documentName,
            documentUrl: `/uploads/documents/${req.file.filename}`,
            notes: notes || '',
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            data: document
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get doctor's documents
// @route   GET /api/documents/my-documents
// @access  Private (Doctor only)
exports.getMyDocuments = async (req, res) => {
    try {
        const documents = await DoctorDocument.find({ doctorId: req.user.id })
            .sort({ uploadedAt: -1 });

        // Fetch user's verification document
        const user = await User.findById(req.user.id);
        const allDocuments = [...documents];

        // If user has a verification document, add it to the beginning of the array
        if (user && user.verificationDocument) {
            const verificationDoc = {
                _id: 'verification-doc',
                documentType: 'verification',
                documentName: 'Verification Document',
                documentUrl: user.verificationDocument,
                notes: 'Document uploaded during registration',
                status: 'verified',
                uploadedAt: user.createdAt,
                verifiedAt: user.createdAt,
                isVerificationDocument: true
            };
            allDocuments.unshift(verificationDoc);
        }

        res.status(200).json({
            success: true,
            data: allDocuments
        });
    } catch (error) {
        console.error('Error getting documents:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private (Doctor only)
exports.updateDocument = async (req, res) => {
    try {
        const { documentName, documentType, notes } = req.body;

        let document = await DoctorDocument.findById(req.params.id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Check if document belongs to user
        if (document.doctorId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this document'
            });
        }

        // Update fields
        if (documentName) document.documentName = documentName;
        if (documentType) document.documentType = documentType;
        if (notes !== undefined) document.notes = notes;

        await document.save();

        res.status(200).json({
            success: true,
            data: document
        });
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private (Doctor only)
exports.deleteDocument = async (req, res) => {
    try {
        const document = await DoctorDocument.findById(req.params.id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Check if document belongs to user
        if (document.doctorId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this document'
            });
        }

        // Delete file from filesystem
        const filePath = path.join(__dirname, '../../', document.documentUrl);
        try {
            await fs.unlink(filePath);
        } catch (err) {
            console.log('File not found or already deleted');
        }

        // Delete document from database
        await DoctorDocument.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all documents (Admin only)
// @route   GET /api/documents/all
// @access  Private (Admin only)
exports.getAllDocuments = async (req, res) => {
    try {
        const { status } = req.query;

        const filter = {};
        if (status) filter.status = status;

        const documents = await DoctorDocument.find(filter)
            .populate('doctorId', 'name email')
            .populate('verifiedBy', 'name')
            .sort({ uploadedAt: -1 });

        res.status(200).json({
            success: true,
            data: documents
        });
    } catch (error) {
        console.error('Error getting all documents:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Verify document (Admin only)
// @route   PUT /api/documents/:id/verify
// @access  Private (Admin only)
exports.verifyDocument = async (req, res) => {
    try {
        const document = await DoctorDocument.findById(req.params.id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        document.status = 'verified';
        document.verifiedBy = req.user.id;
        document.verifiedAt = new Date();

        await document.save();

        res.status(200).json({
            success: true,
            data: document
        });
    } catch (error) {
        console.error('Error verifying document:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Reject document (Admin only)
// @route   PUT /api/documents/:id/reject
// @access  Private (Admin only)
exports.rejectDocument = async (req, res) => {
    try {
        const { reason } = req.body;

        const document = await DoctorDocument.findById(req.params.id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        document.status = 'rejected';
        document.rejectionReason = reason || 'Document rejected by admin';
        document.verifiedBy = req.user.id;
        document.verifiedAt = new Date();

        await document.save();

        res.status(200).json({
            success: true,
            data: document
        });
    } catch (error) {
        console.error('Error rejecting document:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Download document
// @route   GET /api/documents/:id/download
// @access  Private (Doctor only)
exports.downloadDocument = async (req, res) => {
    try {
        let documentUrl, documentName;

        // Handle verification document
        if (req.params.id === 'verification-doc') {
            const user = await User.findById(req.user.id);
            if (!user || !user.verificationDocument) {
                return res.status(404).json({
                    success: false,
                    message: 'Verification document not found'
                });
            }
            documentUrl = user.verificationDocument;
            documentName = 'Verification Document';
        } else {
            // Handle regular documents
            const document = await DoctorDocument.findById(req.params.id);

            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            // Check if document belongs to user
            if (document.doctorId.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to download this document'
                });
            }

            documentUrl = document.documentUrl;
            documentName = document.documentName;
        }

        const filePath = path.join(__dirname, '../../', documentUrl);
        const fileName = documentName + path.extname(documentUrl);

        // Set headers to force download
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        // Send file
        res.sendFile(filePath);
    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    View document (inline)
// @route   GET /api/documents/:id/view
// @access  Private (Doctor only)
exports.viewDocument = async (req, res) => {
    try {
        let documentUrl, documentName;

        // Handle verification document
        if (req.params.id === 'verification-doc') {
            const user = await User.findById(req.user.id);
            if (!user || !user.verificationDocument) {
                return res.status(404).json({
                    success: false,
                    message: 'Verification document not found'
                });
            }
            documentUrl = user.verificationDocument;
            documentName = 'Verification Document';
        } else {
            // Handle regular documents
            const document = await DoctorDocument.findById(req.params.id);

            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            // Check if document belongs to user
            if (document.doctorId.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view this document'
                });
            }

            documentUrl = document.documentUrl;
            documentName = document.documentName;
        }

        const filePath = path.join(__dirname, '../../', documentUrl);
        const ext = path.extname(documentUrl).toLowerCase();

        // Set appropriate content type based on file extension
        let contentType = 'application/octet-stream';
        if (ext === '.pdf') {
            contentType = 'application/pdf';
        } else if (ext === '.jpg' || ext === '.jpeg') {
            contentType = 'image/jpeg';
        } else if (ext === '.png') {
            contentType = 'image/png';
        }

        // Set headers to display inline (view in browser)
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Content-Type', contentType);

        // Send file
        res.sendFile(filePath);
    } catch (error) {
        console.error('Error viewing document:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

