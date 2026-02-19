import axios from 'axios';
import dataSource from '../libs/typeorm.config';
import { Province } from '../modules/province/entities/province.entity';
import { Ward } from '../modules/province/entities/ward.entity';

const API_BASE = 'https://provinces.open-api.vn/api/v2';

async function seed() {
  await dataSource.initialize();
  console.log('Database connected.');

  const provinceRepo = dataSource.getRepository(Province);
  const wardRepo = dataSource.getRepository(Ward);

  // Step 1: Fetch all provinces
  console.log('Fetching provinces...');
  const { data: provinces } = await axios.get(`${API_BASE}/p/`);
  console.log(`Fetched ${provinces.length} provinces. Now fetching wards for each...\n`);

  let totalWards = 0;

  for (const p of provinces) {
    // Insert province
    await provinceRepo.upsert(
      {
        code: p.code,
        name: p.name,
        division_type: p.division_type,
        codename: p.codename,
        phone_code: p.phone_code,
      },
      ['code'],
    );

    // Fetch province detail with wards (depth=2)
    const { data: detail } = await axios.get(`${API_BASE}/p/${p.code}?depth=2`);
    const wards = detail.wards || [];

    if (wards.length > 0) {
      const wardEntities = wards.map((w: any) => ({
        code: w.code,
        name: w.name,
        division_type: w.division_type,
        codename: w.codename,
        province_code: p.code,
      }));

      for (let i = 0; i < wardEntities.length; i += 500) {
        const chunk = wardEntities.slice(i, i + 500);
        await wardRepo.upsert(chunk, ['code']);
      }
    }

    totalWards += wards.length;
    console.log(`  ✔ ${p.name} (${wards.length} wards)`);
  }

  console.log(`\nDone! ${provinces.length} provinces, ${totalWards} wards.`);
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
