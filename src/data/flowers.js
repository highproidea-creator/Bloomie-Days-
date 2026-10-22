/** Stable IDs are shared by the library, 3D picking, and future bouquet saves. */
export const flowers = Object.freeze([
  { id: 'tulip', name: 'ทิวลิป', english: 'Tulip', family: 'Tulipa', color: '#e9a0ad', center: '#f5d995', form: 'tulip', meaning: 'ความรักที่อ่อนโยนและจริงใจ', description: 'กลีบดอกโอบเข้าหากันเหมือนถ้วยใบเล็ก ทิวลิปทำให้มุมธรรมดาดูอบอุ่นขึ้นได้ เป็นเหมือนคำบอกว่าดีใจที่มีคุณอยู่ตรงนี้' },
  { id: 'daisy', name: 'เดซี่', english: 'Daisy', family: 'Bellis', color: '#fff9e9', center: '#e6bb5d', form: 'daisy', meaning: 'ความสดใสและการเริ่มต้นใหม่', description: 'กลีบสีขาวล้อมเกสรสีเหลืองเล็ก ๆ เหมือนแสงแดดอ่อนในตอนเช้า เดซี่ชวนให้เรามองเห็นความสุขในสิ่งเล็กน้อยของทุกวัน' },
  { id: 'rose', name: 'กุหลาบ', english: 'Rose', family: 'Rosa', color: '#d68694', center: '#b96578', form: 'rose', meaning: 'ความรัก ความขอบคุณ และความอ่อนโยน', description: 'กลีบซ้อนนุ่ม ๆ ของกุหลาบสีชมพูดูราวกับริบบิ้นที่ค่อย ๆ คลี่ออก เหมาะกับการบอกขอบคุณใครสักคนที่ทำให้วันของเราดีขึ้น' },
  { id: 'lavender', name: 'ลาเวนเดอร์', english: 'Lavender', family: 'Lavandula', color: '#afa1d1', center: '#8c7bb5', form: 'lavender', meaning: 'ความสงบและความทรงจำที่อ่อนหวาน', description: 'ช่อสีม่วงเล็ก ๆ เรียงตัวตามก้านเรียว ลาเวนเดอร์ชวนให้นึกถึงการหยุดพัก หายใจช้า ๆ และให้เวลากับตัวเองสักนิด' },
  { id: 'sunflower', name: 'ทานตะวัน', english: 'Sunflower', family: 'Helianthus', color: '#f1c65e', center: '#8d6550', form: 'sunflower', meaning: 'ความหวังและการมองหาด้านที่สดใส', description: 'ดอกสีเหลืองอบอุ่นเหมือนดวงอาทิตย์จิ๋ว ทานตะวันเป็นกำลังใจเล็ก ๆ ให้หันไปหาแสงสว่าง แม้ในวันที่ฟ้าดูไม่ค่อยเป็นใจ' },
  { id: 'hydrangea', name: 'ไฮเดรนเยีย', english: 'Hydrangea', family: 'Hydrangea', color: '#a6bdd7', center: '#e3e9ba', form: 'hydrangea', meaning: 'ความเข้าใจและคำขอบคุณจากหัวใจ', description: 'ดอกเล็กมากมายอยู่รวมกันเป็นพุ่มกลมฟู เหมือนความสุขเล็ก ๆ ที่สะสมจนเต็มหัวใจ ไฮเดรนเยียในร้านของเรามีสีฟ้าพาสเทลอ่อนโยน' },
  { id: 'cosmos', name: 'คอสมอส', english: 'Cosmos', family: 'Cosmos', color: '#e5a7c4', center: '#eac46d', form: 'cosmos', meaning: 'ความกลมกลืนและความสุขที่เรียบง่าย', description: 'กลีบบางเบาบนก้านเรียวดูเหมือนกำลังเต้นรำกับสายลม คอสมอสเตือนว่าเราไม่จำเป็นต้องสมบูรณ์แบบ ก็สวยงามในแบบของตัวเองได้' },
  { id: 'peony', name: 'พีโอนี', english: 'Peony', family: 'Paeonia', color: '#f0bac5', center: '#d990a3', form: 'peony', meaning: 'ความสุข ความอบอุ่น และความปรารถนาดี', description: 'กลีบนุ่มซ้อนกันหลายชั้นจนดูฟูเหมือนปอมปอม พีโอนีเป็นเหมือนอ้อมกอดสีชมพู ที่อยากส่งต่อความปรารถนาดีให้กับคนพิเศษ' },
]);

export const flowerById = new Map(flowers.map(flower => [flower.id, flower]));

/** Validates new catalog entries before rendering; no fixed-size indexing. */
export function validateCatalog(catalog) {
  const ids = new Set();
  const supported = new Set(['tulip', 'daisy', 'rose', 'lavender', 'sunflower', 'hydrangea', 'cosmos', 'peony']);
  for (const flower of catalog) {
    if (!flower.id || ids.has(flower.id)) throw new Error(`Duplicate or missing flower ID: ${flower.id}`);
    ids.add(flower.id);
    for (const field of ['name', 'english', 'family', 'meaning', 'description']) {
      if (typeof flower[field] !== 'string' || !flower[field].trim()) throw new Error(`Missing ${field}: ${flower.id}`);
    }
    if (!supported.has(flower.form)) throw new Error(`Unknown flower form: ${flower.form}`);
    for (const field of ['color', 'center']) if (!/^#[\da-f]{6}$/i.test(flower[field])) throw new Error(`Invalid ${field}: ${flower.id}`);
  }
  return true;
}
