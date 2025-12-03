// ===========================================

// Material Library Routes

// For Ozone Material Editor cloud sync

// ===========================================

 

import { Router } from 'express';

import { PrismaClient } from '@prisma/client';

import { requireAuth } from '../middleware/auth.js';

 

const router = Router();

const prisma = new PrismaClient();

 

// ===========================================

// GET /api/library - Fetch user's material library

// ===========================================

router.get('/', requireAuth, async (req, res) => {

    try {

        const library = await prisma.materialLibrary.findUnique({

            where: { userId: req.user.id }

        });

 

        if (!library) {

            // Return empty library if none exists

            return res.json({

                materials: {},

                categories: ['Metals', 'Plastics', 'Glass', 'Wood', 'Fabric', 'Stone', 'Custom'],

                lastSyncedAt: null

            });

        }

 

        res.json({

            materials: library.materials,

            categories: library.categories,

            lastSyncedAt: library.lastSyncedAt

        });

    } catch (error) {

        console.error('Failed to fetch library:', error);

        res.status(500).json({

            error: { message: 'Failed to fetch material library' }

        });

    }

});

 

// ===========================================

// POST /api/library/sync - Sync material library to cloud

// ===========================================

router.post('/sync', requireAuth, async (req, res) => {

    try {

        const { materials, categories } = req.body;

 

        // Validate input

        if (typeof materials !== 'object') {

            return res.status(400).json({

                error: { message: 'Invalid materials format' }

            });

        }

 

        if (!Array.isArray(categories)) {

            return res.status(400).json({

                error: { message: 'Invalid categories format' }

            });

        }

 

        // Upsert the library

        const library = await prisma.materialLibrary.upsert({

            where: { userId: req.user.id },

            update: {

                materials,

                categories,

                lastSyncedAt: new Date()

            },

            create: {

                userId: req.user.id,

                materials,

                categories,

                lastSyncedAt: new Date()

            }

        });

 

        res.json({

            success: true,

            lastSyncedAt: library.lastSyncedAt,

            materialCount: Object.keys(materials).length

        });

    } catch (error) {

        console.error('Failed to sync library:', error);

        res.status(500).json({

            error: { message: 'Failed to sync material library' }

        });

    }

});

 

// ===========================================

// GET /api/library/material/:id - Get single material

// ===========================================

router.get('/material/:id', requireAuth, async (req, res) => {

    try {

        const { id } = req.params;

 

        const library = await prisma.materialLibrary.findUnique({

            where: { userId: req.user.id }

        });

 

        if (!library || !library.materials[id]) {

            return res.status(404).json({

                error: { message: 'Material not found' }

            });

        }

 

        res.json(library.materials[id]);

    } catch (error) {

        console.error('Failed to fetch material:', error);

        res.status(500).json({

            error: { message: 'Failed to fetch material' }

        });

    }

});

 

// ===========================================

// PUT /api/library/material/:id - Update single material

// ===========================================

router.put('/material/:id', requireAuth, async (req, res) => {

    try {

        const { id } = req.params;

        const materialData = req.body;

 

        // Get existing library

        let library = await prisma.materialLibrary.findUnique({

            where: { userId: req.user.id }

        });

 

        if (!library) {

            // Create new library with this material

            library = await prisma.materialLibrary.create({

                data: {

                    userId: req.user.id,

                    materials: { [id]: { ...materialData, id, updatedAt: new Date().toISOString() } },

                    categories: ['Metals', 'Plastics', 'Glass', 'Wood', 'Fabric', 'Stone', 'Custom']

                }

            });

        } else {

            // Update existing library

            const materials = { ...library.materials };

            materials[id] = { ...materialData, id, updatedAt: new Date().toISOString() };

 

            library = await prisma.materialLibrary.update({

                where: { userId: req.user.id },

                data: {

                    materials,

                    lastSyncedAt: new Date()

                }

            });

        }

 

        res.json({

            success: true,

            material: library.materials[id]

        });

    } catch (error) {

        console.error('Failed to update material:', error);

        res.status(500).json({

            error: { message: 'Failed to update material' }

        });

    }

});

 

// ===========================================

// DELETE /api/library/material/:id - Delete single material

// ===========================================

router.delete('/material/:id', requireAuth, async (req, res) => {

    try {

        const { id } = req.params;

 

        const library = await prisma.materialLibrary.findUnique({

            where: { userId: req.user.id }

        });

 

        if (!library) {

            return res.status(404).json({

                error: { message: 'Library not found' }

            });

        }

 

        const materials = { ...library.materials };

 

        if (!materials[id]) {

            return res.status(404).json({

                error: { message: 'Material not found' }

            });

        }

 

        delete materials[id];

 

        await prisma.materialLibrary.update({

            where: { userId: req.user.id },

            data: {

                materials,

                lastSyncedAt: new Date()

            }

        });

 

        res.json({ success: true });

    } catch (error) {

        console.error('Failed to delete material:', error);

        res.status(500).json({

            error: { message: 'Failed to delete material' }

        });

    }

});

 

// ===========================================

// POST /api/library/categories - Update categories

// ===========================================

router.post('/categories', requireAuth, async (req, res) => {

    try {

        const { categories } = req.body;

 

        if (!Array.isArray(categories)) {

            return res.status(400).json({

                error: { message: 'Categories must be an array' }

            });

        }

 

        await prisma.materialLibrary.upsert({

            where: { userId: req.user.id },

            update: { categories },

            create: {

                userId: req.user.id,

                materials: {},

                categories

            }

        });

 

        res.json({ success: true, categories });

    } catch (error) {

        console.error('Failed to update categories:', error);

        res.status(500).json({

            error: { message: 'Failed to update categories' }

        });

    }

});

 

export default router;