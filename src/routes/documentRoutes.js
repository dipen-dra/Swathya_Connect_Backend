const express = require('express');
const router = express.Router();
const {
    uploadDocument,
    getMyDocuments,
    updateDocument,
    deleteDocument,
    getAllDocuments,
    verifyDocument,
    rejectDocument,
    downloadDocument
} = require('../controllers/documentController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Doctor routes
router.post('/upload', protect, authorize('doctor'), upload.single('document'), uploadDocument);
router.get('/my-documents', protect, authorize('doctor'), getMyDocuments);
router.get('/:id/download', protect, authorize('doctor'), downloadDocument);
router.put('/:id', protect, authorize('doctor'), updateDocument);
router.delete('/:id', protect, authorize('doctor'), deleteDocument);

// Admin routes
router.get('/all', protect, authorize('admin'), getAllDocuments);
router.put('/:id/verify', protect, authorize('admin'), verifyDocument);
router.put('/:id/reject', protect, authorize('admin'), rejectDocument);

module.exports = router;
