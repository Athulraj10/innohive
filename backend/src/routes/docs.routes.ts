import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger';

const router = Router();

router.use('/', swaggerUi.serve);
router.get(
  '/',
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Mini Competition Dashboard API Documentation',
    customfavIcon: '/favicon.ico',
  })
);

router.get('/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

export default router;

