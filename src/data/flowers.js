/** Stable IDs are shared by the library, 3D picking, and future bouquet saves. */
const originals = [
  { id: 'tulip', name: 'ทิวลิป', english: 'Tulip', family: 'Tulipa', color: '#e9a0ad', center: '#f5d995', form: 'tulip', meaning: 'ความรักที่อ่อนโยนและจริงใจ', description: 'กลีบดอกโอบเข้าหากันเหมือนถ้วยใบเล็ก ทิวลิปทำให้มุมธรรมดาดูอบอุ่นขึ้นได้ เป็นเหมือนคำบอกว่าดีใจที่มีคุณอยู่ตรงนี้' },
  { id: 'daisy', name: 'เดซี่', english: 'Daisy', family: 'Bellis', color: '#fff9e9', center: '#e6bb5d', form: 'daisy', meaning: 'ความสดใสและการเริ่มต้นใหม่', description: 'กลีบสีขาวล้อมเกสรสีเหลืองเล็ก ๆ เหมือนแสงแดดอ่อนในตอนเช้า เดซี่ชวนให้เรามองเห็นความสุขในสิ่งเล็กน้อยของทุกวัน' },
  { id: 'rose', name: 'กุหลาบ', english: 'Rose', family: 'Rosa', color: '#d68694', center: '#b96578', form: 'rose', meaning: 'ความรัก ความขอบคุณ และความอ่อนโยน', description: 'กลีบซ้อนนุ่ม ๆ ของกุหลาบสีชมพูดูราวกับริบบิ้นที่ค่อย ๆ คลี่ออก เหมาะกับการบอกขอบคุณใครสักคนที่ทำให้วันของเราดีขึ้น' },
  { id: 'lavender', name: 'ลาเวนเดอร์', english: 'Lavender', family: 'Lavandula', color: '#afa1d1', center: '#8c7bb5', form: 'lavender', meaning: 'ความสงบและความทรงจำที่อ่อนหวาน', description: 'ช่อสีม่วงเล็ก ๆ เรียงตัวตามก้านเรียว ลาเวนเดอร์ชวนให้นึกถึงการหยุดพัก หายใจช้า ๆ และให้เวลากับตัวเองสักนิด' },
  { id: 'sunflower', name: 'ทานตะวัน', english: 'Sunflower', family: 'Helianthus', color: '#f1c65e', center: '#8d6550', form: 'sunflower', meaning: 'ความหวังและการมองหาด้านที่สดใส', description: 'ดอกสีเหลืองอบอุ่นเหมือนดวงอาทิตย์จิ๋ว ทานตะวันเป็นกำลังใจเล็ก ๆ ให้หันไปหาแสงสว่าง แม้ในวันที่ฟ้าดูไม่ค่อยเป็นใจ' },
  { id: 'hydrangea', name: 'ไฮเดรนเยีย', english: 'Hydrangea', family: 'Hydrangea', color: '#a6bdd7', center: '#e3e9ba', form: 'hydrangea', meaning: 'ความเข้าใจและคำขอบคุณจากหัวใจ', description: 'ดอกเล็กมากมายอยู่รวมกันเป็นพุ่มกลมฟู เหมือนความสุขเล็ก ๆ ที่สะสมจนเต็มหัวใจ ไฮเดรนเยียในร้านของเรามีสีฟ้าพาสเทลอ่อนโยน' },
  { id: 'cosmos', name: 'คอสมอส', english: 'Cosmos', family: 'Cosmos', color: '#e5a7c4', center: '#eac46d', form: 'cosmos', meaning: 'ความกลมกลืนและความสุขที่เรียบง่าย', description: 'กลีบบางเบาบนก้านเรียวดูเหมือนกำลังเต้นรำกับสายลม คอสมอสเตือนว่าเราไม่จำเป็นต้องสมบูรณ์แบบ ก็สวยงามในแบบของตัวเองได้' },
  { id: 'peony', name: 'พีโอนี', english: 'Peony', family: 'Paeonia', color: '#f0bac5', center: '#d990a3', form: 'peony', meaning: 'ความสุข ความอบอุ่น และความปรารถนาดี', description: 'กลีบนุ่มซ้อนกันหลายชั้นจนดูฟูเหมือนปอมปอม พีโอนีเป็นเหมือนอ้อมกอดสีชมพู ที่อยากส่งต่อความปรารถนาดีให้กับคนพิเศษ' },
];

// Distinct flower types, rather than color variants counted as new species.
// Forms are original clay interpretations, not botanical identification models.
const additions = [
  ['cherry-blossom', 'ซากุระ', 'Cherry blossom', 'Prunus', '#f5c9d2', '#d98d9e', 'star', 'ความงามของช่วงเวลาที่ผ่านเข้ามา', 'กลีบชมพูห้ากลีบดูเบาเหมือนเมฆยามเช้า ซากุระชวนให้เก็บช่วงเวลาดี ๆ ตรงหน้าไว้ในใจ'],
  ['lily', 'ลิลลี่', 'Lily', 'Lilium', '#fff3d9', '#e3b875', 'lily', 'ความบริสุทธิ์และความปรารถนาดี', 'กลีบเรียวยาวค่อย ๆ คลี่ออก ลิลลี่สีครีมเพิ่มความสงบให้มุมเล็ก ๆ ของร้าน'],
  ['orchid', 'กล้วยไม้', 'Orchid', 'Phalaenopsis', '#d7b1d2', '#b97a9d', 'orchid', 'ความสง่างามและความใส่ใจ', 'กลีบโค้งเหมือนปีกผีเสื้อน้อย กล้วยไม้ในกระถางจิ๋วชวนให้มองความละเอียดอ่อนอย่างช้า ๆ'],
  ['jasmine', 'มะลิ', 'Jasmine', 'Jasminum', '#fffdf0', '#e3dca9', 'star', 'ความรักที่บริสุทธิ์และอบอุ่น', 'ดอกสีขาวเล็ก ๆ กลีบเรียงเป็นดาว มะลิเป็นความอ่อนโยนที่ไม่ต้องใช้คำพูดมากมาย'],
  ['gardenia', 'พุดซ้อน', 'Gardenia', 'Gardenia', '#fff6e3', '#e9d9b0', 'rose', 'ความชื่นชมจากใจ', 'กลีบสีงาช้างซ้อนเป็นวงนุ่ม พุดซ้อนเหมือนคำชมเบา ๆ ที่ทำให้ใครสักคนยิ้ม'],
  ['lotus', 'บัวหลวง', 'Lotus', 'Nelumbo', '#ebbbcf', '#ecd182', 'lily', 'การเติบโตและใจที่สงบ', 'กลีบชมพูโอบเกสรสีอุ่น บัวหลวงชวนให้ค่อย ๆ เติบโตในจังหวะของตัวเอง'],
  ['marigold', 'ดาวเรือง', 'Marigold', 'Tagetes', '#eec66e', '#dbaa51', 'peony', 'ความอบอุ่นและกำลังใจ', 'ดอกกลมแน่นสีเหลืองอ่อน ดาวเรืองในร้านเป็นเหมือนแสงแดดจิ๋วในวันที่ต้องการแรงใจ'],
  ['carnation', 'คาร์เนชัน', 'Carnation', 'Dianthus', '#e7acbb', '#c9889e', 'peony', 'ความรักและคำขอบคุณ', 'กลีบหยักซ้อนกันเหมือนชายผ้านุ่ม คาร์เนชันส่งคำขอบคุณที่อ่อนหวานและเรียบง่าย'],
  ['gerbera', 'เยอบีร่า', 'Gerbera', 'Gerbera', '#edb592', '#d9b264', 'daisy', 'รอยยิ้มและความสดใส', 'กลีบสีพีชแผ่รอบเกสรกลม เยอบีร่าเหมือนรอยยิ้มที่รอทักทายอยู่ข้างหน้าต่าง'],
  ['chrysanthemum', 'เบญจมาศ', 'Chrysanthemum', 'Chrysanthemum', '#f4dfab', '#d4bb78', 'peony', 'มิตรภาพที่ยาวนาน', 'กลีบเล็กซ้อนกันเป็นพุ่มนุ่ม เบญจมาศชวนให้นึกถึงเพื่อนที่อยู่เคียงข้างในทุกฤดู'],
  ['lisianthus', 'ไลเซนทัส', 'Lisianthus', 'Eustoma', '#cdb9d9', '#a491bc', 'rose', 'ความซาบซึ้งและความจริงใจ', 'กลีบม่วงอ่อนพลิ้วเหมือนผ้าบาง ไลเซนทัสเป็นคำขอบคุณสำหรับการมีใครสักคนอยู่ตรงนี้'],
  ['forget-me-not', 'ฟอร์เก็ตมีน็อต', 'Forget-me-not', 'Myosotis', '#a8c8e1', '#f2d78d', 'star', 'ความทรงจำที่ยังอยู่เสมอ', 'ดอกฟ้าเล็กมีใจกลางสีเหลือง ฟอร์เก็ตมีน็อตเก็บเรื่องราวอุ่น ๆ ไว้เหมือนสมุดบันทึกเล่มจิ๋ว'],
  ['babys-breath', 'ยิปโซ', "Baby’s breath", 'Gypsophila', '#fff8e9', '#e8ddb6', 'hydrangea', 'ความรักที่อ่อนโยนและยั่งยืน', 'ดอกขาวเล็กมากมายรวมตัวราวกับละอองเมฆ ยิปโซเติมความนุ่มนวลให้พื้นที่รอบตัว'],
  ['lily-of-the-valley', 'ลิลลี่แห่งหุบเขา', 'Lily of the Valley', 'Convallaria', '#fff9ea', '#d9e1b9', 'valley', 'การกลับมาของความสุข', 'ระฆังสีขาวเล็ก ๆ ห้อยตามก้านโค้ง ราวกับกำลังกระซิบบอกว่าความสุขจะกลับมาอีกครั้ง'],
  ['anemone', 'แอนีโมนี', 'Anemone', 'Anemone', '#d7b5d4', '#796b91', 'cosmos', 'ความหวังและการเฝ้ารออย่างอ่อนโยน', 'กลีบม่วงชมพูโอบเกสรสีเข้ม แอนีโมนีมีความงามเรียบง่ายที่ชวนให้หยุดมอง'],
  ['ranunculus', 'รานังคูลัส', 'Ranunculus', 'Ranunculus', '#efc3ac', '#d7a38c', 'rose', 'เสน่ห์และความชื่นชม', 'กลีบสีแอปริคอตเรียงซ้อนเป็นวงเล็ก ๆ เหมือนริบบิ้นที่ม้วนไว้อย่างตั้งใจ'],
  ['iris', 'ไอริส', 'Iris', 'Iris', '#afa3d0', '#e6cd86', 'iris', 'ความเชื่อมั่นและปัญญา', 'กลีบตั้งสามกลีบและกลีบโค้งลงสามกลีบ มีแต้มสีทองอ่อน ไอริสเป็นกำลังใจให้เชื่อในเส้นทางที่เราเลือกเดิน'],
  ['snowdrop', 'สโนว์ดรอป', 'Snowdrop', 'Galanthus', '#fffdf2', '#a9bf93', 'snowdrop', 'ความหวังแรกหลังวันหนาว', 'ดอกสีขาวห้อยจากก้านโค้ง กลีบนอกยาวโอบกลีบในแต้มเขียว สโนว์ดรอปบอกว่าความอบอุ่นกำลังกลับมา'],
  ['daffodil', 'แดฟโฟดิล', 'Daffodil', 'Narcissus', '#f2dc94', '#dcb35d', 'lily', 'การเริ่มต้นฤดูใหม่', 'ดอกเหลืองอ่อนเหมือนแสงแรกของฤดูใบไม้ผลิ แดฟโฟดิลชวนให้เริ่มต้นใหม่ด้วยใจเบา ๆ'],
  ['poppy', 'ป๊อปปี้', 'Poppy', 'Papaver', '#dfa19b', '#816c66', 'cosmos', 'ความทรงจำและการพักใจ', 'กลีบสีปะการังดูเบาเหมือนกระดาษบาง ป๊อปปี้ชวนให้พักจากวันที่เร่งรีบสักครู่'],
  ['hibiscus', 'ชบา', 'Hibiscus', 'Hibiscus', '#e7acb6', '#d8ba76', 'star', 'ความงามที่เรียบง่าย', 'กลีบชมพูแผ่ออกอย่างเปิดเผย ชบาเติมบรรยากาศสดใสเหมือนสวนหน้าบ้านในวันสบาย ๆ'],
  ['plumeria', 'ลีลาวดี', 'Plumeria', 'Plumeria', '#fff0d7', '#ead38d', 'star', 'ความอ่อนโยนและการเริ่มต้น', 'กลีบครีมปลายมนมีสีเหลืองอุ่นตรงกลาง ลีลาวดีชวนให้นึกถึงลมอ่อนในสวนเงียบ ๆ'],
  ['bougainvillea', 'เฟื่องฟ้า', 'Bougainvillea', 'Bougainvillea', '#d9a0bf', '#f0e4b7', 'hydrangea', 'ความสดใสและใจที่เข้มแข็ง', 'พุ่มสีชมพูอมม่วงเหมือนกระดาษพับ เฟื่องฟ้าทำให้มุมเล็ก ๆ มีชีวิตชีวาขึ้นทันที'],
  ['magnolia', 'แมกโนเลีย', 'Magnolia', 'Magnolia', '#f5e7d7', '#d7bf91', 'lily', 'ความสง่างามและความมั่นคง', 'กลีบหนาสีงาช้างโค้งอย่างนุ่มนวล แมกโนเลียมีความสงบที่ทำให้รู้สึกอบอุ่นใจ'],
  ['camellia', 'คามิลเลีย', 'Camellia', 'Camellia', '#e5a8b2', '#cb8997', 'rose', 'ความชื่นชมที่อ่อนหวาน', 'กลีบชมพูเรียงเป็นวงสมดุล คามิลเลียเหมือนคำบอกว่าคุณมีความงามในแบบของตัวเอง'],
  ['zinnia', 'บานชื่น', 'Zinnia', 'Zinnia', '#eab9a4', '#d3b473', 'daisy', 'มิตรภาพและความร่าเริง', 'ดอกสีพีชแผ่กลีบเป็นวง บานชื่นเป็นดอกไม้เล็ก ๆ สำหรับวันพบเพื่อนเก่า'],
  ['sweet-pea', 'สวีตพี', 'Sweet pea', 'Lathyrus', '#d6b4d6', '#b093ba', 'orchid', 'คำขอบคุณสำหรับช่วงเวลาดี ๆ', 'กลีบสีม่วงชมพูคล้ายปีกเล็ก ๆ สวีตพีเก็บความอ่อนหวานของการได้ใช้เวลาร่วมกัน'],
  ['delphinium', 'เดลฟิเนียม', 'Delphinium', 'Delphinium', '#a7badd', '#e5e7c6', 'lavender', 'ใจที่เปิดกว้างและความเบิกบาน', 'ช่อฟ้าเรียวยาวแต้มความเย็นสบาย เดลฟิเนียมเหมือนท้องฟ้าใสหลังฝนผ่านไป'],
  ['snapdragon', 'ลิ้นมังกร', 'Snapdragon', 'Antirrhinum', '#edc1be', '#dfd19f', 'bell', 'ความกล้าหาญที่อ่อนโยน', 'ดอกเล็กเรียงตามก้านสูงเป็นช่อ ลิ้นมังกรในแบบดินปั้นดูเหมือนระฆังชมพูที่กำลังยิ้ม'],
  ['foxglove', 'ฟ็อกซ์โกลฟ', 'Foxglove', 'Digitalis', '#ceadd0', '#ecdbdd', 'bell', 'จินตนาการและความลึกลับของสวน', 'ดอกทรงระฆังสีม่วงอ่อนชวนให้นึกถึงสวนในนิทาน เป็นดอกไม้สำหรับชื่นชมด้วยสายตา'],
  ['wisteria', 'วิสทีเรีย', 'Wisteria', 'Wisteria', '#bcafd9', '#a296c4', 'lavender', 'การต้อนรับและความผูกพัน', 'ช่อม่วงอ่อนดูเหมือนม่านนุ่ม ๆ วิสทีเรียเติมความฝันเล็ก ๆ ให้วันธรรมดา'],
  ['lilac', 'ไลแลค', 'Lilac', 'Syringa', '#c7b3d7', '#efdfed', 'hydrangea', 'ความรู้สึกดีในวันแรกพบ', 'ดอกเล็กสีม่วงรวมเป็นพุ่มฟู ไลแลคชวนให้นึกถึงการเริ่มต้นรู้จักใครสักคน'],
  ['aster', 'แอสเตอร์', 'Aster', 'Symphyotrichum', '#c7b9dc', '#e2c478', 'daisy', 'ความอดทนและความรักที่อบอุ่น', 'กลีบม่วงเรียวล้อมเกสรสีทอง แอสเตอร์เหมือนดาวเล็ก ๆ ที่ผลิบานอยู่ในสวน'],
  ['statice', 'สแตติส', 'Statice', 'Limonium', '#b2a1cb', '#e8d9bd', 'hydrangea', 'ความทรงจำที่ไม่จางหาย', 'พุ่มดอกเล็กสีม่วงมีเสน่ห์เรียบง่าย สแตติสชวนให้เก็บเรื่องราวที่ทำให้ยิ้มไว้เสมอ'],
  ['calendula', 'คาเลนดูล่า', 'Calendula', 'Calendula', '#ebc08b', '#cbaa72', 'daisy', 'ความอบอุ่นและการปลอบใจ', 'กลีบสีส้มอ่อนเหมือนแสงแดดยามเย็น คาเลนดูล่าเป็นสีสบายตาสำหรับมุมพักใจ'],
  ['bluebell', 'บลูเบลล์', 'Bluebell', 'Hyacinthoides', '#aab9d7', '#d8dff0', 'bell', 'ความอ่อนน้อมและความผูกพัน', 'ระฆังฟ้าเล็ก ๆ เรียงตามก้าน บลูเบลล์เหมือนเสียงทักทายเงียบ ๆ จากสวนร่มรื่น'],
  ['dahlia', 'รักเร่', 'Dahlia', 'Dahlia', '#dba6b8', '#bd849c', 'peony', 'ความสง่างามและความเข้มแข็ง', 'กลีบเรียงซ้อนเป็นดอกกลมแน่น รักเร่ชวนให้ภูมิใจในความพยายามเล็ก ๆ ของตัวเอง'],
  ['scabiosa', 'สคาบิโอซา', 'Scabiosa', 'Scabiosa', '#c2afcd', '#9b8ab0', 'cosmos', 'ความอ่อนโยนที่เป็นเอกลักษณ์', 'ใจกลางฟูเล็กล้อมด้วยกลีบม่วงอ่อน สคาบิโอซามีความน่ารักที่มองแล้วอยากยิ้มตาม'],
  ['freesia', 'ฟรีเซีย', 'Freesia', 'Freesia', '#f4dfb2', '#dabf85', 'bell', 'ความไว้ใจและมิตรภาพ', 'ดอกสีครีมเหลืองเรียงเป็นช่ออ่อน ฟรีเซียเป็นคำสัญญาเล็ก ๆ ว่าจะรับฟังกันเสมอ'],
  ['amaryllis', 'ว่านสี่ทิศ', 'Amaryllis', 'Hippeastrum', '#e3b1b1', '#d4c296', 'lily', 'ความภูมิใจและความมั่นใจ', 'กลีบกว้างสีชมพูอุ่นคลี่ออกอย่างสง่า ว่านสี่ทิศชวนให้กล้าเป็นตัวเองอย่างอ่อนโยน'],
  ['protea', 'โพรเทีย', 'Protea', 'Protea', '#d9acb5', '#c4aa8c', 'tulip', 'การเปลี่ยนแปลงและความกล้าหาญ', 'กลีบหนาโอบเกสรเป็นถ้วยนุ่ม โพรเทียมีรูปทรงพิเศษเหมือนของขวัญจากสวนในฝัน'],
  ['water-lily', 'บัวสาย', 'Water lily', 'Nymphaea', '#cbb9dd', '#e7d291', 'lily', 'ความสงบและความหวัง', 'กลีบม่วงอ่อนเรียงเป็นดาว บัวสายชวนให้นึกถึงผิวน้ำเงียบ ๆ ในเช้าวันใหม่'],
  ['mock-orange', 'แก้ว', 'Orange jasmine', 'Murraya', '#fffae8', '#e7d7a2', 'star', 'ความใสสะอาดและความอบอุ่นของบ้าน', 'ดอกสีขาวกลีบเล็กเรียบง่าย ดอกแก้วเป็นเหมือนคำต้อนรับจากสวนหน้าบ้านที่คุ้นเคย'],
];

const catalog = [...originals, ...additions.map(([id, name, english, family, color, center, form, meaning, description]) => ({ id, name, english, family, color, center, form, meaning, description }))];
const whiteOnly = new Set(['lily-of-the-valley','snowdrop','jasmine','gardenia','mock-orange','babys-breath']);
const petalCounts = { poppy:4, anemone:6, gerbera:16, zinnia:12, aster:18, calendula:14, camellia:9, gardenia:8 };
export const flowers = Object.freeze(catalog.map(flower => ({ ...flower,
  petalCount: petalCounts[flower.id],
  leafShape: ['lily','iris','snowdrop','valley','bell'].includes(flower.form) ? 'strap' : flower.form==='lavender' ? 'slender' : 'oval',
  colors: [{ value:flower.color, label:'สีประจำดอก' }, ...(!whiteOnly.has(flower.id) ? [{value:'#fff9ed',label:'ขาวครีม'},{value:'#e8b4c4',label:'ชมพูพาสเทล'}].filter(c=>c.value!==flower.color) : [])],
})));

export const flowerById = new Map(flowers.map(flower => [flower.id, flower]));

/** Validates new catalog entries before rendering; no fixed-size indexing. */
export function validateCatalog(catalog) {
  const ids = new Set();
  const supported = new Set(['tulip', 'daisy', 'rose', 'lavender', 'sunflower', 'hydrangea', 'cosmos', 'peony', 'lily', 'orchid', 'star', 'bell', 'valley', 'snowdrop', 'iris']);
  for (const flower of catalog) {
    if (!flower.id || ids.has(flower.id)) throw new Error(`Duplicate or missing flower ID: ${flower.id}`);
    ids.add(flower.id);
    for (const field of ['name', 'english', 'family', 'meaning', 'description']) {
      if (typeof flower[field] !== 'string' || !flower[field].trim()) throw new Error(`Missing ${field}: ${flower.id}`);
    }
    if (!supported.has(flower.form)) throw new Error(`Unknown flower form: ${flower.form}`);
    for (const field of ['color', 'center']) if (!/^#[\da-f]{6}$/i.test(flower[field])) throw new Error(`Invalid ${field}: ${flower.id}`);
    if (!flower.colors?.length || !flower.colors.every(c=>/^#[\da-f]{6}$/i.test(c.value)&&c.label)) throw new Error(`Invalid colors: ${flower.id}`);
  }
  return true;
}
