import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Configuración común de la aplicación (CORS, validación global y Swagger).
 * Está separada de main.ts para poder probarla.
 */
export function configurarApp(app: INestApplication) {
  // CORS: si FRONTEND_URL está definida solo se acepta ese origen (varios, separados
  // por comas). Si no, se acepta cualquiera, lo cual es cómodo en desarrollo.
  const origenes = process.env.FRONTEND_URL?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors(origenes?.length ? { origin: origenes } : undefined);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const documento = new DocumentBuilder()
    .setTitle('Habit Tracker API')
    .setDescription(
      'API REST del Habit Tracker: usuarios, hábitos, seguimiento diario y estadísticas. ' +
        'Para probar los endpoints protegidos: inicia sesión con POST /auth/login, ' +
        'copia el token y pulsa "Authorize".',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, documento), {
    swaggerOptions: { persistAuthorization: true },
  });
}
