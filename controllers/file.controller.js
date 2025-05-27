import File from '../models/file.model.js';
import { supabase } from '../lib/supabase.js';

export const uploadFile = async (req, res) => {
    try {
        const file = req.file;
        const {
            userId,
            userName,
            departmentId,
            accessLevel,
            isPublic,
            tags,
            riskScore,
            contentCategory,
            keywords,
            language,
            readingLevel,
            sensitiveContent,
            maliciousContent,
            detectedEntities
        } = req.body;

        if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = `uploads/${Date.now()}_${file.originalname}`;

        const { error } = await supabase
        .storage
        .from('files') // Replace with your actual bucket name
        .upload(filePath, file.buffer, {
            contentType: file.mimetype
        });

        if (error) throw error;

        const { data } = supabase
        .storage
        .from('files')
        .getPublicUrl(filePath);

        const newFile = await File.create({
        fileName: file.originalname,
        type: file.mimetype,
        size: file.size,
        path: data.publicUrl,
        uploadedByUserId: userId,
        uploadedByUserName: userName,
        departmentId,
        accessLevel: Array.isArray(accessLevel) ? accessLevel : [accessLevel],
        riskScore: Number(riskScore),
        tags: tags ? tags.split(',') : [],
        contentAnalysis: {
            contentCategory: contentCategory ? contentCategory.split(',') : [],
            keywords: keywords ? keywords.split(',') : [],
            language,
            readingLevel,
            sensitiveContent: sensitiveContent === 'true',
            maliciousContent: maliciousContent === 'true',
            detectedEntities: detectedEntities ? detectedEntities.split(',') : []
        }
        });

        res.status(201).json(newFile);
    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ error: err.message });
    }
};

export const getAllFiles = async (req, res) => {
    try {
        const files = await File.find().sort({ createdAt: -1 });
        res.json(files);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
