import express from 'express';
import apiRouter from './api.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use('/api', apiRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 