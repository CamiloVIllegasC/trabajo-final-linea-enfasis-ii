import express from 'express'
import cors from 'cors'; 
import logger from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import citasRoutes from './routes/citas.routes.js';
import especialidadesRoutes from './routes/especialidades.routes.js'
import doctorRoutes from './routes/doctors.routes.js';
import adminDashboardRoutes from './routes/admin.dashboard.routes.js';

dotenv.config(); 

const port = process.env.PORT ?? 3000; 

const app = express(); 
app.use(cors());
app.use(logger('dev'));
app.use(express.json());


app.use("/api/auth", authRoutes)
app.use("/api", doctorRoutes)
app.use("/api", citasRoutes )
app.use("/api", especialidadesRoutes)
app.use("/api", adminDashboardRoutes)

app.listen(port, () => {
    console.log('Servidor corriendo en el puerto', port);
})
