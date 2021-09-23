import { Router } from 'express';

const router = Router();

// Route for the "pseudo" authenticated user
router.get('/', async (req, res) => {
    const user = await req.context.models.User.findById(
        req.context.me.id,
    );
    return res.send(user);
});

export default router;