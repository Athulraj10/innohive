import { Router } from 'express';
import {
  listCompetitions,
  getCompetition,
  create,
  join,
  getChartDataController,
  getParticipantsController,
  validateCreateCompetition,
  handleValidationErrors,
} from '../controllers/competitions.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/competitions:
 *   get:
 *     summary: List all competitions with pagination and filtering
 *     tags: [Competitions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search competitions by name or description
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [createdAt, prizePool, entryFee, participantCount]
 *         description: Sort field
 *       - in: query
 *         name: joined
 *         schema:
 *           type: boolean
 *         description: Filter by joined status (requires authentication)
 *     responses:
 *       200:
 *         description: List of competitions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Competition'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/', optionalAuthenticate, listCompetitions);

/**
 * @swagger
 * /api/competitions/{id}/chart:
 *   get:
 *     summary: Get chart data (candlestick) for a competition
 *     tags: [Competitions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Competition ID
 *       - in: query
 *         name: from
 *         schema:
 *           type: integer
 *         description: Start timestamp (Unix timestamp)
 *       - in: query
 *         name: to
 *         schema:
 *           type: integer
 *         description: End timestamp (Unix timestamp)
 *       - in: query
 *         name: res
 *         schema:
 *           type: string
 *           default: '1D'
 *         description: Resolution (for future use)
 *     responses:
 *       200:
 *         description: Chart data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     candles:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ChartDataPoint'
 *       404:
 *         description: Competition not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id/chart', getChartDataController);

/**
 * @swagger
 * /api/competitions/{id}/participants:
 *   get:
 *     summary: Get all participants of a competition with details
 *     tags: [Competitions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Competition ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of participants with rank, portfolio value, and profit/loss
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       userId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       competitionId:
 *                         type: string
 *                       joinedAt:
 *                         type: string
 *                         format: date-time
 *                       rank:
 *                         type: integer
 *                         description: Participant rank based on portfolio value
 *                       portfolioValue:
 *                         type: number
 *                         description: Current portfolio value
 *                       profitLoss:
 *                         type: number
 *                         description: Profit/Loss percentage
 *       404:
 *         description: Competition not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id/participants', getParticipantsController);

/**
 * @swagger
 * /api/competitions/{id}:
 *   get:
 *     summary: Get a specific competition by ID
 *     tags: [Competitions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Competition ID
 *     responses:
 *       200:
 *         description: Competition details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Competition'
 *       404:
 *         description: Competition not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', getCompetition);

/**
 * @swagger
 * /api/competitions:
 *   post:
 *     summary: Create a new competition (requires authentication)
 *     tags: [Competitions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCompetitionRequest'
 *     responses:
 *       201:
 *         description: Competition created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Competition'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', authenticate, validateCreateCompetition, handleValidationErrors, create);

/**
 * @swagger
 * /api/competitions/{id}/join:
 *   post:
 *     summary: Join a competition (requires authentication)
 *     tags: [Competitions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Competition ID
 *     responses:
 *       200:
 *         description: Successfully joined the competition
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     participationId:
 *                       type: string
 *       400:
 *         description: Competition is full, already joined, or has ended
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Competition not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:id/join', authenticate, join);

export default router;

