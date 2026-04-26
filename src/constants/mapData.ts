export interface PlaceItem {
  name: string;
  image: string;
  description: string;
}

export interface Province {
  id: string;
  name: string;
  region: "North" | "Central" | "South";
  /** Approximate SVG path for the province on a 400x800 viewBox map of Vietnam */
  path: string;
  /** Label position [x, y] on the same viewBox */
  labelPos: [number, number];
  attractions: PlaceItem[];
  foods: PlaceItem[];
}

const img = (seed: string) =>
  `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=600&q=70`;

// NOTE: SVG paths below are stylized polygonal approximations of each province
// arranged along Vietnam's S-curve. They are placeholders intended to be swapped
// for a real geo-accurate SVG or the Goong Map API later.
export const PROVINCES: Province[] = [
  {
    id: "ha-giang",
    name: "Hà Giang",
    region: "North",
    path: "M 175 60 L 230 55 L 245 95 L 220 120 L 180 115 L 165 85 Z",
    labelPos: [205, 88],
    attractions: [
      { name: "Đồng Văn Karst Plateau", image: img("1528127269322-539801943592"), description: "Otherworldly limestone peaks UNESCO calls a global geopark." },
      { name: "Mã Pí Lèng Pass", image: img("1509233725247-49e657c54213"), description: "One of Vietnam's 'Four Great Passes' with dramatic gorge views." },
      { name: "Lung Cu Flag Tower", image: img("1528909514045-2fa4ac7a08ba"), description: "Stand at the northernmost point of Vietnam." },
    ],
    foods: [
      { name: "Thắng Cố", image: img("1547592180-85f173990554"), description: "Hearty highland stew, a H'Mong market staple." },
      { name: "Buckwheat Cake", image: img("1565299624946-b28f40a0ae38"), description: "Soft, nutty cakes from Hà Giang's pink flower fields." },
    ],
  },
  {
    id: "ha-noi",
    name: "Hà Nội",
    region: "North",
    path: "M 195 175 L 245 170 L 260 210 L 230 235 L 195 225 L 185 195 Z",
    labelPos: [220, 200],
    attractions: [
      { name: "Hoàn Kiếm Lake", image: img("1583417319070-4a69db38a482"), description: "The serene heart of the Old Quarter and its red bridge." },
      { name: "Old Quarter", image: img("1509923936155-3f6bf2f1c4f8"), description: "36 ancient streets buzzing with motorbikes and street food." },
      { name: "Temple of Literature", image: img("1606744837616-56c9a5c6a7de"), description: "Vietnam's first university, dating back to 1070." },
    ],
    foods: [
      { name: "Phở Bò", image: img("1569718212165-3a8278d5f624"), description: "The original beef noodle soup, simmered for hours." },
      { name: "Bún Chả", image: img("1583224964978-2257b960c3d3"), description: "Grilled pork with vermicelli — Obama's pick in Hanoi." },
      { name: "Egg Coffee", image: img("1442550528053-c431ecb55509"), description: "Velvety whipped yolk over robust Vietnamese coffee." },
    ],
  },
  {
    id: "ha-long",
    name: "Quảng Ninh",
    region: "North",
    path: "M 260 180 L 310 175 L 325 215 L 295 240 L 260 230 Z",
    labelPos: [290, 208],
    attractions: [
      { name: "Hạ Long Bay", image: img("1528127269322-539801943592"), description: "1,600 emerald karst islands rising from jade waters." },
      { name: "Sung Sot Cave", image: img("1528909514045-2fa4ac7a08ba"), description: "The 'Surprise Cave' — a colossal grotto of stalactites." },
    ],
    foods: [
      { name: "Chả Mực", image: img("1547592180-85f173990554"), description: "Hand-pounded squid cakes, springy and savory." },
      { name: "Sá Sùng", image: img("1565299624946-b28f40a0ae38"), description: "Rare sandworm delicacy that sweetens broths." },
    ],
  },
  {
    id: "ninh-binh",
    name: "Ninh Bình",
    region: "North",
    path: "M 195 240 L 250 235 L 265 280 L 230 305 L 195 290 Z",
    labelPos: [225, 268],
    attractions: [
      { name: "Tràng An", image: img("1528127269322-539801943592"), description: "Sampan rides through cathedral-like limestone caves." },
      { name: "Tam Cốc", image: img("1509233725247-49e657c54213"), description: "Rice paddies winding between karst towers." },
      { name: "Bái Đính Pagoda", image: img("1606744837616-56c9a5c6a7de"), description: "Southeast Asia's largest Buddhist temple complex." },
    ],
    foods: [
      { name: "Cơm Cháy", image: img("1569718212165-3a8278d5f624"), description: "Crispy rice crust drizzled with savory shredded pork sauce." },
      { name: "Goat Meat", image: img("1547592180-85f173990554"), description: "Free-range mountain goat — the local specialty." },
    ],
  },
  {
    id: "hue",
    name: "Huế",
    region: "Central",
    path: "M 215 360 L 270 355 L 285 400 L 250 425 L 215 410 Z",
    labelPos: [245, 388],
    attractions: [
      { name: "Imperial Citadel", image: img("1606744837616-56c9a5c6a7de"), description: "The walled city of the Nguyễn emperors." },
      { name: "Thiên Mụ Pagoda", image: img("1583417319070-4a69db38a482"), description: "Seven-tiered pagoda on the Perfume River." },
      { name: "Royal Tombs", image: img("1528909514045-2fa4ac7a08ba"), description: "Elaborate hillside mausoleums hidden in pine forests." },
    ],
    foods: [
      { name: "Bún Bò Huế", image: img("1569718212165-3a8278d5f624"), description: "Spicy lemongrass beef noodle soup with a royal pedigree." },
      { name: "Bánh Bèo", image: img("1583224964978-2257b960c3d3"), description: "Tiny steamed rice cakes topped with shrimp." },
    ],
  },
  {
    id: "da-nang",
    name: "Đà Nẵng",
    region: "Central",
    path: "M 230 425 L 285 420 L 300 465 L 265 490 L 230 475 Z",
    labelPos: [260, 453],
    attractions: [
      { name: "Golden Bridge", image: img("1528127269322-539801943592"), description: "Pedestrian bridge held aloft by giant stone hands." },
      { name: "Marble Mountains", image: img("1509233725247-49e657c54213"), description: "Five marble peaks riddled with Buddhist caves." },
      { name: "My Khe Beach", image: img("1507525428034-b723cf961d3e"), description: "Six kilometers of soft white sand and warm surf." },
    ],
    foods: [
      { name: "Mì Quảng", image: img("1569718212165-3a8278d5f624"), description: "Turmeric noodles with shrimp, pork and crispy cracker." },
      { name: "Bánh Xèo", image: img("1583224964978-2257b960c3d3"), description: "Sizzling crepes filled with shrimp and bean sprouts." },
    ],
  },
  {
    id: "hoi-an",
    name: "Quảng Nam",
    region: "Central",
    path: "M 240 490 L 300 485 L 315 530 L 280 555 L 240 540 Z",
    labelPos: [275, 518],
    attractions: [
      { name: "Hội An Ancient Town", image: img("1559592413-7cec4d0cae2b"), description: "Lantern-lit UNESCO town frozen in trading-port time." },
      { name: "My Son Sanctuary", image: img("1606744837616-56c9a5c6a7de"), description: "Crumbling Cham Hindu temples in a jungle valley." },
    ],
    foods: [
      { name: "Cao Lầu", image: img("1569718212165-3a8278d5f624"), description: "Smoky pork noodles unique to Hội An's old wells." },
      { name: "White Rose Dumplings", image: img("1583224964978-2257b960c3d3"), description: "Delicate shrimp dumplings shaped like roses." },
    ],
  },
  {
    id: "da-lat",
    name: "Đà Lạt",
    region: "Central",
    path: "M 215 580 L 275 575 L 290 620 L 255 645 L 215 630 Z",
    labelPos: [250, 608],
    attractions: [
      { name: "Xuân Hương Lake", image: img("1507525428034-b723cf961d3e"), description: "Crescent-shaped lake at the city's pine-scented heart." },
      { name: "Datanla Falls", image: img("1528127269322-539801943592"), description: "Roaring cascades reached by an alpine coaster." },
      { name: "Flower Gardens", image: img("1490750967868-88aa4486c946"), description: "Endless blooms in Vietnam's highland 'City of Eternal Spring'." },
    ],
    foods: [
      { name: "Bánh Tráng Nướng", image: img("1583224964978-2257b960c3d3"), description: "Grilled rice paper 'Vietnamese pizza' from night markets." },
      { name: "Artichoke Tea", image: img("1442550528053-c431ecb55509"), description: "Earthy, cooling brew from Đà Lạt's mountain farms." },
    ],
  },
  {
    id: "ho-chi-minh",
    name: "TP. Hồ Chí Minh",
    region: "South",
    path: "M 165 660 L 230 655 L 245 700 L 210 725 L 165 715 L 155 685 Z",
    labelPos: [200, 690],
    attractions: [
      { name: "Notre-Dame Basilica", image: img("1583417319070-4a69db38a482"), description: "Twin red-brick towers built with Marseille bricks." },
      { name: "Bến Thành Market", image: img("1509923936155-3f6bf2f1c4f8"), description: "Iconic clock-tower bazaar, the city's beating belly." },
      { name: "Cu Chi Tunnels", image: img("1528909514045-2fa4ac7a08ba"), description: "200km of hand-dug wartime tunnels you can crawl." },
    ],
    foods: [
      { name: "Bánh Mì", image: img("1558030006-450675393462"), description: "Crackling baguette stuffed with pâté, pork, herbs and chili." },
      { name: "Cơm Tấm", image: img("1569718212165-3a8278d5f624"), description: "Broken rice with grilled pork chop — Saigon's daily ritual." },
      { name: "Hủ Tiếu", image: img("1583224964978-2257b960c3d3"), description: "Clear-broth noodles with a southern Chinese accent." },
    ],
  },
  {
    id: "can-tho",
    name: "Cần Thơ",
    region: "South",
    path: "M 100 700 L 160 695 L 175 735 L 140 760 L 100 750 Z",
    labelPos: [135, 728],
    attractions: [
      { name: "Cái Răng Floating Market", image: img("1559592413-7cec4d0cae2b"), description: "Sunrise commerce on the Hậu River from boat to boat." },
      { name: "Mekong Delta Tours", image: img("1528127269322-539801943592"), description: "Coconut groves, fruit orchards and palm-thatched canals." },
    ],
    foods: [
      { name: "Bánh Xèo Miền Tây", image: img("1583224964978-2257b960c3d3"), description: "Giant golden crepes packed with shrimp and herbs." },
      { name: "Cá Lóc Nướng Trui", image: img("1547592180-85f173990554"), description: "Whole snakehead fish flame-grilled on rice straw." },
    ],
  },
  {
    id: "phu-quoc",
    name: "Phú Quốc",
    region: "South",
    path: "M 50 740 L 90 745 L 95 785 L 60 790 L 45 770 Z",
    labelPos: [70, 765],
    attractions: [
      { name: "Sao Beach", image: img("1507525428034-b723cf961d3e"), description: "Powder-white sand curving into turquoise sea." },
      { name: "Vinpearl Safari", image: img("1490750967868-88aa4486c946"), description: "Vietnam's first open-zoo with free-roaming wildlife." },
    ],
    foods: [
      { name: "Phú Quốc Fish Sauce", image: img("1565299624946-b28f40a0ae38"), description: "World-famous nước mắm aged in wooden vats." },
      { name: "Bún Quậy", image: img("1569718212165-3a8278d5f624"), description: "DIY 'stirred' noodle soup with fresh seafood." },
    ],
  },
];
