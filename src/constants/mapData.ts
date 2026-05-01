export type PlaceItem = {
  name: string;
  image: string;
  description: string;
};

export type Place = {
  id: string;
  name: string;
  province: string;
  region: "North" | "Central" | "South";
  lat: number;
  lng: number;
  coverImage: string;
  shortDescription: string;
  attractions: PlaceItem[];
  foods: PlaceItem[];
};

const img = (seed: string) =>
  `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=600&q=70`;

export const MOCK_PLACES: Place[] = [
  {
    id: "ha-noi",
    name: "Hà Nội",
    province: "Hà Nội",
    region: "North",
    lat: 21.0278,
    lng: 105.8342,
    coverImage: img("1583417319070-4a69db38a482"),
    shortDescription: "Thủ đô nghìn năm văn hiến, nổi bật với phố cổ, hồ Hoàn Kiếm và ẩm thực đường phố.",
    attractions: [
      {
        name: "Hồ Hoàn Kiếm",
        image: img("1583417319070-4a69db38a482"),
        description: "Biểu tượng trung tâm của Hà Nội.",
      },
      {
        name: "Phố cổ Hà Nội",
        image: img("1509923936155-3f6bf2f1c4f8"),
        description: "Khu phố lâu đời với nhiều hàng quán và văn hóa bản địa.",
      },
    ],
    foods: [
      {
        name: "Phở bò",
        image: img("1569718212165-3a8278d5f624"),
        description: "Món ăn biểu tượng của Hà Nội.",
      },
      {
        name: "Bún chả",
        image: img("1583224964978-2257b960c3d3"),
        description: "Thịt nướng ăn cùng bún, rau sống và nước chấm.",
      },
    ],
  },
  {
    id: "da-nang",
    name: "Đà Nẵng",
    province: "Đà Nẵng",
    region: "Central",
    lat: 16.0544,
    lng: 108.2022,
    coverImage: img("1507525428034-b723cf961d3e"),
    shortDescription: "Thành phố biển miền Trung, nổi bật với biển Mỹ Khê, Bà Nà Hills và cầu Rồng.",
    attractions: [
      {
        name: "Biển Mỹ Khê",
        image: img("1507525428034-b723cf961d3e"),
        description: "Một trong những bãi biển nổi tiếng nhất Đà Nẵng.",
      },
      {
        name: "Cầu Vàng",
        image: img("1528127269322-539801943592"),
        description: "Cây cầu biểu tượng tại Bà Nà Hills.",
      },
    ],
    foods: [
      {
        name: "Mì Quảng",
        image: img("1569718212165-3a8278d5f624"),
        description: "Món mì đặc trưng miền Trung.",
      },
      {
        name: "Bánh xèo",
        image: img("1583224964978-2257b960c3d3"),
        description: "Bánh giòn ăn cùng rau sống và nước chấm.",
      },
    ],
  },
  {
    id: "hoi-an",
    name: "Hội An",
    province: "Quảng Nam",
    region: "Central",
    lat: 15.8801,
    lng: 108.338,
    coverImage: img("1559592413-7cec4d0cae2b"),
    shortDescription: "Phố cổ nổi tiếng với đèn lồng, kiến trúc cổ và văn hóa thương cảng.",
    attractions: [
      {
        name: "Phố cổ Hội An",
        image: img("1559592413-7cec4d0cae2b"),
        description: "Di sản văn hóa thế giới được UNESCO công nhận.",
      },
      {
        name: "Chùa Cầu",
        image: img("1606744837616-56c9a5c6a7de"),
        description: "Biểu tượng kiến trúc của Hội An.",
      },
    ],
    foods: [
      {
        name: "Cao lầu",
        image: img("1569718212165-3a8278d5f624"),
        description: "Món mì đặc sản chỉ nổi tiếng ở Hội An.",
      },
      {
        name: "Bánh mì Hội An",
        image: img("1558030006-450675393462"),
        description: "Bánh mì giòn với nhân đậm vị.",
      },
    ],
  },
  {
    id: "ho-chi-minh",
    name: "TP. Hồ Chí Minh",
    province: "TP. Hồ Chí Minh",
    region: "South",
    lat: 10.7769,
    lng: 106.7009,
    coverImage: img("1509923936155-3f6bf2f1c4f8"),
    shortDescription: "Thành phố năng động nhất Việt Nam, nổi bật với chợ Bến Thành, phố đi bộ và ẩm thực đa dạng.",
    attractions: [
      {
        name: "Chợ Bến Thành",
        image: img("1509923936155-3f6bf2f1c4f8"),
        description: "Biểu tượng mua sắm và ẩm thực của Sài Gòn.",
      },
      {
        name: "Nhà thờ Đức Bà",
        image: img("1583417319070-4a69db38a482"),
        description: "Công trình kiến trúc nổi bật ở trung tâm thành phố.",
      },
    ],
    foods: [
      {
        name: "Cơm tấm",
        image: img("1569718212165-3a8278d5f624"),
        description: "Món ăn phổ biến của người Sài Gòn.",
      },
      {
        name: "Bánh mì",
        image: img("1558030006-450675393462"),
        description: "Món ăn nhanh nổi tiếng khắp Việt Nam.",
      },
    ],
  },
];