import { createAllVectorIndexes } from '../src/utils/bengaliVectorIndexes';

(async () => {
  await createAllVectorIndexes();
  process.exit(0);
})();