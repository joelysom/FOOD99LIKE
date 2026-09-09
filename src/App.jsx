import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BadgePlus,
  BarChart3,
  Camera,
  CarFront,
  ChevronRight,
  CircleCheck,
  Clipboard,
  CupSoda,
  CreditCard,
  ExternalLink,
  Flame,
  Heart,
  LayoutGrid,
  Leaf,
  List,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Mic,
  Minus,
  Nfc,
  Pencil,
  Plus,
  QrCode,
  ReceiptText,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShoppingCart,
  Table2,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import cocoBackground from './assets/images/cocobambu_fundo.png'
import promoShrimp from './assets/images/slide_0.png'
import promoScampi from './assets/images/slide_2.png'
import categoriaBebidas from './assets/cards/hd/img bebidas@3x.jpg'
import categoriaCarnes from './assets/cards/hd/img carne@3x.jpg'
import categoriaEntradas from './assets/cards/hd/img entradas@3x.jpg'
import categoriaFrangos from './assets/cards/hd/img frango@3x.jpg'
import categoriaFrutosDoMar from './assets/cards/hd/img frutos do mar@3x.jpg'
import categoriaSaladas from './assets/cards/hd/img saladas@3x.jpg'
import categoriaSobremesas from './assets/cards/hd/img sobremesas@3x.jpg'
import categoriaVeganos from './assets/cards/hd/img vegano@3x.jpg'
import pratoCaldinhoDePeixe from './assets/images/crops/prato-caldinho-de-peixe.png'
import pratoCamaraoCocoBrasil from './assets/images/crops/prato-camarao-coco-brasil.png'
import pratoIscaDePeixe from './assets/images/crops/prato-isca-de-peixe.png'
import slideVezzBanner from './assets/images/crops/slide-vezz-banner-transparent.png'
import cocoLogo from './assets/images/hd/logo-coco-bambu@4x.png'
import iconBebidas from './assets/icons/icon bebidas.png'
import iconCarnes from './assets/icons/icon carne.png'
import iconEntradas from './assets/icons/icon entrada.png'
import iconFrangos from './assets/icons/icon frango.png'
import iconFrutosDoMar from './assets/icons/icon frutos do mar.png'
import iconSaladas from './assets/icons/icon salada.png'
import iconSobremesas from './assets/icons/icon sobremesa.png'
import iconVeganos from './assets/icons/icon vegano.png'
import allergenCastanhas from './assets/icons/castanhas.png'
import allergenCrustaceos from './assets/icons/crustaceos.png'
import allergenGluten from './assets/icons/gluten.png'
import allergenLactose from './assets/icons/lactose.png'
import allergenOvo from './assets/icons/ovo.png'
import allergenPeixe from './assets/icons/peixe.png'
import allergenSoja from './assets/icons/soja.png'
import {
  changeAdminCredentials,
  createRestaurantWithAdmin,
  loginAdmin,
  logoutAdmin,
  recoverAdminPassword,
  registerAdmin,
  resolveAdminRestaurantId,
  translateAdminAuthError,
  watchAdminSession,
} from './lib/adminAuth'
import { persistAnalyticsEvent, persistOrder } from './lib/firebaseEvents'
import { loadMenuState, readCachedMenuState, resolveRestaurantId, saveMenuState } from './lib/menuPersistence'

const categories = [
  { id: 'entradas', label: 'Entradas', shortLabel: 'Entradas', iconImage: iconEntradas, image: categoriaEntradas },
  { id: 'saladas', label: 'Saladas', shortLabel: 'Saladas', iconImage: iconSaladas, image: categoriaSaladas },
  { id: 'frutos-do-mar', label: 'Frutos do Mar', shortLabel: 'Frutos do Mar', iconImage: iconFrutosDoMar, image: categoriaFrutosDoMar },
  { id: 'carnes', label: 'Carnes', shortLabel: 'Carnes', iconImage: iconCarnes, image: categoriaCarnes },
  { id: 'frangos', label: 'Frangos', shortLabel: 'Frangos', iconImage: iconFrangos, image: categoriaFrangos },
  { id: 'veganos', label: 'Veganos', shortLabel: 'Veganos', iconImage: iconVeganos, image: categoriaVeganos },
  { id: 'sobremesas', label: 'Sobremesas', shortLabel: 'Sobremesas', iconImage: iconSobremesas, image: categoriaSobremesas },
  { id: 'bebidas', label: 'Bebidas', shortLabel: 'Bebidas', iconImage: iconBebidas, image: categoriaBebidas },
]

const fallbackImages = {
  entradas: categoriaEntradas,
  saladas: categoriaSaladas,
  'frutos-do-mar': categoriaFrutosDoMar,
  carnes: categoriaCarnes,
  frangos: categoriaFrangos,
  veganos: categoriaVeganos,
  sobremesas: categoriaSobremesas,
  bebidas: categoriaBebidas,
}

const tableOptions = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

const restaurantId = 'tokka-foods'
const restaurantName = 'COCO BAMBU'
const defaultRestaurantProfile = {
  name: 'COCO BAMBU',
  location: 'Derby, Recife - PE',
  slug: 'coco-bambu',
  logo: cocoLogo,
  cover: cocoBackground,
  theme: {
    primary: '#4b160e',
    accent: '#d8ad61',
    surface: '#ffffff',
  },
}
const defaultAdminEmail = 'cocobambu@tokka.com.br'
const analyticsStorageKey = 'food99like-events'
const sessionStorageKey = 'food99like-session'
const cardBaseUrl = 'https://menu.food99like.app/c/8Ks29'
const partnerLinks = {
  vezz: 'https://vezzapp.com.br/',
  instagram: 'https://www.instagram.com/',
  whatsapp: 'https://wa.me/5581999999999',
}
const protectedPromoSlideId = 'vezz-accessibility'

const promoSlides = [
  {
    id: 'coco-brasil-promo',
    image: promoShrimp,
    title: 'Camarão recheado com promoção',
    subtitle: 'Camarão Praia de Olinda para 2 pessoas por R$ 99,90.',
    targetType: 'promotion',
    productId: 'praia-de-olinda',
    includes: [
      'Camarões refogados ao alho e cebola',
      'Arroz cremoso com manjericão',
      'Finalização com molho branco',
    ],
    conditions: [
      'Promoção sujeita à disponibilidade da cozinha',
      'Válida para consumo no restaurante',
      'Não cumulativa com outras ofertas',
    ],
    delivery: 'Entregue à mesa em travessa quente, pronto para compartilhar.',
    alt: 'Promoção Camarão Coco Bambu por R$ 99,90',
    fit: 'contain',
  },
  {
    id: 'vezz-accessibility',
    image: slideVezzBanner,
    alt: 'Vezz, mobilidade para você ir mais longe',
    action: 'vezz',
    fit: 'contain',
  },
  {
    id: 'camarao-scampi',
    image: promoScampi,
    title: 'Lançamento Camarão Scampi',
    subtitle: 'Camarões salteados com toque cítrico e molho da casa.',
    targetType: 'promotion',
    productId: 'camarao-jurere',
    includes: [
      'Camarões puxados no azeite',
      'Molho aromático com ervas',
      'Acompanhamento sugerido pela cozinha',
    ],
    conditions: [
      'Disponível enquanto durar o estoque',
      'Consulte o garçom sobre substituições',
      'Imagem meramente ilustrativa',
    ],
    delivery: 'O prato chega montado para manter textura, aroma e temperatura.',
    alt: 'Lançamento Camarão Scampi Coco Bambu',
    fit: 'contain',
  },
]

const allergenOptions = [
  { id: 'Ovo', label: 'Ovo', icon: 'ovo' },
  { id: 'Glúten', label: 'Glúten', icon: 'gluten' },
  { id: 'Peixe', label: 'Peixe', icon: 'peixe' },
  { id: 'Lactose', label: 'Lactose', icon: 'lactose' },
  { id: 'Crustáceos', label: 'Crustáceos', icon: 'crustaceos' },
  { id: 'Castanhas', label: 'Castanhas', icon: 'castanhas' },
  { id: 'Soja', label: 'Soja', icon: 'soja' },
]

const baseProducts = [
  {
    id: 'camarao-coco-brasil',
    category: 'frutos-do-mar',
    name: 'Camarão Coco Brasil',
    price: 199,
    image: pratoCamaraoCocoBrasil,
    badge: 'Destaque',
    badgeTone: 'border-amber-200 bg-white text-[#4b160e]',
    badgeIcon: Flame,
    badgeIconTone: 'fill-amber-500 text-amber-500',
    description:
      'Camarões empanados e recheados com catupiry, sobre um cremoso arroz de moqueca com camarões.',
    voiceDescription:
      'Imagine uma travessa larga chegando à mesa. Na borda, camarões empanados formam uma coroa dourada, com casquinha crocante e recheio cremoso de catupiry. No centro, há arroz de moqueca bem úmido, perfumado com coentro e camarões menores. A batata palha aparece por cima como uma camada fina e crocante, criando contraste entre o molho quente, o queijo macio e o empanado.',
    tags: ['Ovo', 'Glúten', 'Peixe', 'Crustáceos', 'Lactose'],
    options: [
      { id: '2p', label: '2 pessoas', detail: '276g de Camarão', price: 199, people: 2 },
      { id: '3p', label: '3 pessoas', detail: '409g de Camarão', price: 240, people: 3 },
      { id: '4p', label: '4 pessoas', detail: '758g de Camarão', price: 405, people: 4 },
    ],
  },
  {
    id: 'camarao-ao-forno',
    category: 'frutos-do-mar',
    name: 'Camarão ao Forno',
    price: 147,
    image: categoriaFrutosDoMar,
    badge: 'Forno',
    badgeTone: 'border-amber-200 bg-white text-[#4b160e]',
    badgeIcon: Flame,
    badgeIconTone: 'fill-amber-500 text-amber-500',
    description:
      'Camarões inteiros levados ligeiramente ao forno, regados com suave molho provençal.',
    voiceDescription:
      'O prato destaca camarões inteiros, alinhados em uma travessa quente. A superfície vem brilhante pelo molho provençal, com aroma de alho, ervas e azeite. A textura tende a ser firme e suculenta, sem peso de fritura. É uma opção com sabor marinho limpo, final aromático e toque tostado do forno.',
    tags: ['Crustáceos', 'Alho', 'Ervas'],
    options: [{ id: '2p', label: '2 pessoas', detail: 'Porção ao forno', price: 147, people: 2 }],
  },
  {
    id: 'camarao-jurere',
    category: 'frutos-do-mar',
    name: 'Camarão Jurerê',
    price: 185,
    image: categoriaFrutosDoMar,
    badge: 'Especial',
    badgeTone: 'border-amber-200 bg-white text-[#4b160e]',
    badgeIcon: Flame,
    badgeIconTone: 'fill-amber-500 text-amber-500',
    description:
      'Camarões puxados no azeite extra virgem, alho e cebola, flambados com vinho branco.',
    voiceDescription:
      'O Camarão Jurerê tem um perfil mais aromático. Primeiro vem o perfume do azeite quente com alho e cebola. Depois aparecem os camarões salteados, levemente adocicados, cobertos por um molho curto de vinho branco. A experiência é mais delicada, com brilho no molho, sabor marinho e final amanteigado.',
    tags: ['Crustáceos', 'Alho', 'Vinho branco'],
    options: [{ id: '2p', label: '2 pessoas', detail: 'Camarões salteados', price: 185, people: 2 }],
  },
  {
    id: 'lagosta-grelhada',
    category: 'frutos-do-mar',
    name: 'Lagosta Grelhada',
    price: 276,
    image: categoriaFrutosDoMar,
    badge: 'Premium',
    badgeTone: 'border-amber-200 bg-white text-[#4b160e]',
    badgeIcon: Flame,
    badgeIconTone: 'fill-amber-500 text-amber-500',
    description:
      'Lagosta grelhada com alcaparras e salsinha. Acompanha arroz de alho-poró e batatas ao vapor.',
    voiceDescription:
      'A lagosta grelhada chega com carne firme e delicada, levemente adocicada. A grelha adiciona aroma tostado, enquanto as alcaparras trazem salinidade e a salsinha entrega frescor. O arroz de alho-poró cria uma base cremosa e perfumada, e as batatas ao vapor equilibram o prato com textura macia.',
    tags: ['Crustáceos', 'Alcaparras', 'Alho-poró'],
    options: [{ id: '2p', label: '2 pessoas', detail: 'Lagosta grelhada', price: 276, people: 2 }],
  },
  {
    id: 'lagosta-com-arroz-dos-mares',
    category: 'frutos-do-mar',
    name: 'Lagosta com Arroz dos Mares',
    price: 270,
    image: categoriaFrutosDoMar,
    badge: 'Destaque',
    badgeTone: 'border-amber-200 bg-white text-[#4b160e]',
    badgeIcon: Flame,
    badgeIconTone: 'fill-amber-500 text-amber-500',
    description:
      'Lagostas grelhadas, salpicadas com alho frito na manteiga, servidas sobre arroz cremoso dos mares.',
    voiceDescription:
      'Neste prato, a lagosta aparece sobre um arroz cremoso e generoso. O alho frito na manteiga adiciona perfume tostado e uma crocância discreta. Cada garfada mistura o dulçor da lagosta, a cremosidade do arroz e o sabor intenso da manteiga aromatizada.',
    tags: ['Crustáceos', 'Manteiga', 'Alho'],
    options: [{ id: '2p', label: '2 pessoas', detail: 'Arroz cremoso dos mares', price: 270, people: 2 }],
  },
  {
    id: 'isca-de-peixe',
    category: 'entradas',
    name: 'Isca de Peixe',
    price: 120,
    image: pratoIscaDePeixe,
    badge: 'Entrada',
    badgeTone: 'border-amber-200 bg-white text-[#4b160e]',
    badgeIcon: BadgePlus,
    badgeIconTone: 'text-amber-600',
    description:
      'Iscas crocantes de peixe, servidas para compartilhar antes do prato principal.',
    voiceDescription:
      'As iscas de peixe são pedaços pequenos, empanados e dourados. A primeira sensação é a crocância da casquinha. Por dentro, o peixe fica macio, suave e úmido. É um prato fácil de dividir, bom para começar a refeição, especialmente com gotas de limão ou molho cremoso.',
    tags: ['Peixe', 'Glúten', 'Compartilhar'],
    options: [{ id: '2p', label: '2 pessoas', detail: 'Porção para entrada', price: 120, people: 2 }],
  },
  {
    id: 'caldinho-de-peixe',
    category: 'entradas',
    name: 'Caldinho de Peixe',
    price: 21,
    image: pratoCaldinhoDePeixe,
    badge: 'Quente',
    badgeTone: 'border-amber-200 bg-white text-[#4b160e]',
    badgeIcon: CupSoda,
    badgeIconTone: 'text-amber-600',
    description:
      'Caldinho cremoso e quente, servido como entrada leve e aromática.',
    voiceDescription:
      'O caldinho de peixe é servido quente, em textura cremosa. O aroma lembra caldo bem temperado, com sabor suave de peixe e final confortável. É uma entrada de colher, pensada para abrir o apetite sem pesar antes dos pratos principais.',
    tags: ['Peixe', 'Quente', 'Caldo'],
    options: [{ id: '1p', label: '1 pessoa', detail: 'Copo individual', price: 21, people: 1 }],
  },
  {
    id: 'salada-tropical',
    category: 'saladas',
    name: 'Salada Tropical',
    price: 64,
    image: categoriaSaladas,
    badge: 'Leve',
    badgeTone: 'border-emerald-100 bg-white text-emerald-700',
    badgeIcon: Leaf,
    badgeIconTone: 'fill-emerald-600 text-emerald-600',
    description:
      'Folhas frescas com legumes, tomate, toque cítrico e final crocante.',
    voiceDescription:
      'A salada tropical é fresca e colorida. As folhas trazem leveza, os legumes adicionam textura e o tomate deixa a mordida mais suculenta. O toque cítrico aparece no final, limpando o paladar e equilibrando pratos mais cremosos.',
    tags: ['Folhas', 'Tomate', 'Leve'],
  },
  {
    id: 'file-paulista',
    category: 'carnes',
    name: 'Filé à Paulista',
    price: 199,
    image: categoriaCarnes,
    badge: 'Destaque',
    badgeTone: 'border-amber-200 bg-white text-[#4b160e]',
    badgeIcon: Flame,
    badgeIconTone: 'fill-amber-500 text-amber-500',
    description:
      'Filé mignon coberto com alhos fritos. Acompanha batatas recheadas e delicioso arroz.',
    voiceDescription:
      'O Filé à Paulista tem carne macia e suculenta, coberta por alhos fritos crocantes. As batatas recheadas trazem cremosidade, enquanto o arroz completa o prato com uma base confortável e bem servida.',
    tags: ['Carne', 'Alho', 'Batata'],
  },
  {
    id: 'frango-grelhado',
    category: 'frangos',
    name: 'Frango Grelhado',
    price: 89,
    image: categoriaFrangos,
    badge: 'Grelhado',
    badgeTone: 'border-amber-200 bg-white text-[#4b160e]',
    badgeIcon: Flame,
    badgeIconTone: 'fill-amber-500 text-amber-500',
    description:
      'Peito de frango grelhado, legumes e acompanhamento leve da casa.',
    voiceDescription:
      'O frango grelhado é uma opção mais direta e leve. A carne vem marcada pela grelha, com aroma tostado e interior macio. Os legumes dão cor, frescor e textura ao prato.',
    tags: ['Frango', 'Legumes', 'Leve'],
  },
  {
    id: 'massa-vegana',
    category: 'veganos',
    name: 'Massa Vegana',
    price: 78,
    image: categoriaVeganos,
    badge: 'Vegano',
    badgeTone: 'border-emerald-100 bg-white text-emerald-700',
    badgeIcon: Leaf,
    badgeIconTone: 'fill-emerald-600 text-emerald-600',
    description:
      'Massa com legumes salteados, ervas frescas e azeite aromático.',
    voiceDescription:
      'A massa vegana combina fios de massa com legumes salteados e ervas frescas. A textura é macia, com pontos crocantes dos vegetais, e o azeite traz brilho e aroma ao prato.',
    tags: ['Vegano', 'Legumes', 'Ervas'],
  },
  {
    id: 'pudim-da-casa',
    category: 'sobremesas',
    name: 'Pudim da Casa',
    price: 28,
    image: categoriaSobremesas,
    badge: 'Doce',
    badgeTone: 'border-amber-200 bg-white text-[#4b160e]',
    badgeIcon: BadgePlus,
    badgeIconTone: 'text-amber-600',
    description:
      'Pudim cremoso com calda brilhante e final delicado.',
    voiceDescription:
      'O pudim da casa é liso, cremoso e servido frio. A calda brilhante escorre por cima, trazendo doçura de caramelo e textura macia em cada colherada.',
    tags: ['Lactose', 'Ovo', 'Caramelo'],
  },
  {
    id: 'drink-tropical',
    category: 'bebidas',
    name: 'Drink Tropical',
    price: 32,
    image: categoriaBebidas,
    badge: 'Gelado',
    badgeTone: 'border-sky-200 bg-white text-sky-600',
    badgeIcon: CupSoda,
    badgeIconTone: 'text-sky-600',
    description:
      'Bebida gelada, cítrica e refrescante para acompanhar frutos do mar.',
    voiceDescription:
      'O drink tropical é frio, aromático e cítrico. Ele refresca o paladar e combina bem com pratos cremosos ou frutos do mar, trazendo leveza entre as garfadas.',
    tags: ['Gelado', 'Cítrico', 'Refrescante'],
  },
]

const appAssetRegistry = {
  'profile.cover.coco-bambu': { src: cocoBackground, tokens: ['cocobambu_fundo'] },
  'profile.logo.coco-bambu': { src: cocoLogo, tokens: ['logo-coco-bambu', 'logo coco bambu'] },
  'promo.coco-brasil': { src: promoShrimp, tokens: ['slide_0', 'slide-0'] },
  'promo.scampi': { src: promoScampi, tokens: ['slide_2', 'slide-2'] },
  'promo.vezz': { src: slideVezzBanner, tokens: ['slide-vezz-banner'] },
  'category.image.bebidas': { src: categoriaBebidas, tokens: ['img bebidas@3x', 'img bebidas'] },
  'category.image.carnes': { src: categoriaCarnes, tokens: ['img carne@3x', 'img carne'] },
  'category.image.entradas': { src: categoriaEntradas, tokens: ['img entradas@3x', 'img entradas'] },
  'category.image.frangos': { src: categoriaFrangos, tokens: ['img frango@3x', 'img frango'] },
  'category.image.frutos-do-mar': { src: categoriaFrutosDoMar, tokens: ['img frutos do mar@3x', 'img frutos do mar'] },
  'category.image.saladas': { src: categoriaSaladas, tokens: ['img saladas@3x', 'img saladas'] },
  'category.image.sobremesas': { src: categoriaSobremesas, tokens: ['img sobremesas@3x', 'img sobremesas'] },
  'category.image.veganos': { src: categoriaVeganos, tokens: ['img vegano@3x', 'img vegano'] },
  'category.icon.bebidas': { src: iconBebidas, tokens: ['icon bebidas'] },
  'category.icon.carnes': { src: iconCarnes, tokens: ['icon carne'] },
  'category.icon.entradas': { src: iconEntradas, tokens: ['icon entrada'] },
  'category.icon.frangos': { src: iconFrangos, tokens: ['icon frango'] },
  'category.icon.frutos-do-mar': { src: iconFrutosDoMar, tokens: ['icon frutos do mar'] },
  'category.icon.saladas': { src: iconSaladas, tokens: ['icon salada'] },
  'category.icon.sobremesas': { src: iconSobremesas, tokens: ['icon sobremesa'] },
  'category.icon.veganos': { src: iconVeganos, tokens: ['icon vegano'] },
  'product.caldinho-de-peixe': { src: pratoCaldinhoDePeixe, tokens: ['prato-caldinho-de-peixe'] },
  'product.camarao-coco-brasil': { src: pratoCamaraoCocoBrasil, tokens: ['prato-camarao-coco-brasil'] },
  'product.isca-de-peixe': { src: pratoIscaDePeixe, tokens: ['prato-isca-de-peixe'] },
}

const appAssetUrlToKey = new Map(
  Object.entries(appAssetRegistry).map(([key, asset]) => [asset.src, key]),
)

function App() {
  const initialTable = getTableFromUrl()
  const initialScreen = getInitialScreen()
  const initialMenuSlug = getMenuSlugFromHash() || defaultRestaurantProfile.slug
  const initialCachedMenuState = readCachedMenuState(restaurantId, initialMenuSlug)
  const initialMenuState = normalizeMenuStateSnapshot(initialCachedMenuState, initialMenuSlug)
  const [analyticsSession] = useState(() => getAnalyticsSession(initialTable))
  const [screen, setScreen] = useState(() => initialScreen)
  const [menuMode, setMenuMode] = useState('padrao')
  const [activeCategory, setActiveCategory] = useState(() => getCategoryFromHash() || 'frutos-do-mar')
  const [menuCategorySelected, setMenuCategorySelected] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState(() => getProductFromHash())
  const [selectedPromoId, setSelectedPromoId] = useState(() => getPromoFromHash())
  const [productReturnScreen, setProductReturnScreen] = useState('menu')
  const [activeMenuSlug, setActiveMenuSlug] = useState(initialMenuSlug)
  const [menuReloadToken, setMenuReloadToken] = useState(0)
  const [menuLoadState, setMenuLoadState] = useState(() => ({
    failed: false,
    loading: shouldBlockCustomMenuPaint(initialMenuSlug, initialCachedMenuState),
    slug: initialMenuSlug,
  }))
  const [restaurantProfile, setRestaurantProfile] = useState(initialMenuState.profile)
  const [activeRestaurantId, setActiveRestaurantId] = useState(restaurantId)
  const [categories, setCategories] = useState(initialMenuState.categories)
  const [promoItems, setPromoItems] = useState(initialMenuState.promoItems)
  const [products, setProducts] = useState(initialMenuState.products)
  const [favoriteProductIds, setFavoriteProductIds] = useState([])
  const [cart, setCart] = useState([])
  const [editingCartItem, setEditingCartItem] = useState(null)
  const [tableNumber, setTableNumber] = useState(initialTable || '')
  const [nfcTable, setNfcTable] = useState(initialTable || '01')
  const [copied, setCopied] = useState(false)
  const [orderSent, setOrderSent] = useState(false)
  const [voiceReaderEnabled, setVoiceReaderEnabled] = useState(false)
  const [voiceCommandListening, setVoiceCommandListening] = useState(false)
  const [readerStatus, setReaderStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [adminSession, setAdminSession] = useState({
    loading: true,
    user: null,
    isAdmin: false,
    error: '',
  })
  const [adminLoginError, setAdminLoginError] = useState('')
  const [adminLoginLoading, setAdminLoginLoading] = useState(false)
  const [adminRegisterError, setAdminRegisterError] = useState('')
  const [adminRegisterLoading, setAdminRegisterLoading] = useState(false)
  const [adminPasswordResetLoading, setAdminPasswordResetLoading] = useState(false)
  const [toasts, setToasts] = useState([])
  const speechStopTimerRef = useRef(null)
  const toastTimersRef = useRef(new Map())
  const adminRegistrationPendingRef = useRef(false)
  const initialMenuEventSyncedRef = useRef(false)
  const menuStateLoadedRef = useRef(false)
  const [analyticsEvents, setAnalyticsEvents] = useState(() => {
    const nextEvents = [
      ...readAnalyticsEvents(),
      buildAnalyticsEvent('menu_open', analyticsSession, {
        tableNumber: initialTable || '',
        language: 'pt-BR',
      }),
    ].slice(-500)

    saveAnalyticsEvents(nextEvents)
    return nextEvents
  })

  const menuProducts = useMemo(
    () => products.filter((product) => product.active !== false),
    [products],
  )
  const selectedProduct =
    menuProducts.find((product) => product.id === selectedProductId) ?? menuProducts[0] ?? products[0]
  const selectedPromo = promoItems.find((slide) => slide.id === selectedPromoId) ?? promoItems[0]
  const cartItems = cart
    .map((item) => ({
      ...item,
      product: menuProducts.find((product) => product.id === item.productId),
    }))
    .filter((item) => item.product)
  const cartTotal = cartItems.reduce(
    (total, item) => total + (item.unitPrice ?? item.product.price) * item.quantity,
    0,
  )
  const cartQuantity = cartItems.reduce((total, item) => total + item.quantity, 0)
  const generatedNfcLink = buildNfcUrl(nfcTable || tableNumber || '01', restaurantProfile.slug)
  const analyticsSummary = useMemo(
    () => buildAnalyticsSummary(analyticsEvents, products, analyticsSession),
    [analyticsEvents, products, analyticsSession],
  )
  const menuPlaceholderActive =
    isPublicMenuScreen(screen)
    && menuLoadState.slug === activeMenuSlug
    && (menuLoadState.loading || menuLoadState.failed)

  const trackEvent = useCallback(
    (eventName, payload = {}) => {
      const event = buildAnalyticsEvent(eventName, analyticsSession, payload)

      setAnalyticsEvents((events) => {
        const nextEvents = [...events, event].slice(-500)
        saveAnalyticsEvents(nextEvents)
        return nextEvents
      })

      persistAnalyticsEvent(event)
    },
    [analyticsSession],
  )

  const removeToast = useCallback((toastId) => {
    const timer = toastTimersRef.current.get(toastId)

    if (timer) {
      window.clearTimeout(timer)
      toastTimersRef.current.delete(toastId)
    }

    setToasts((items) => items.filter((toast) => toast.id !== toastId))
  }, [])

  const pushToast = useCallback(
    ({ title, message = '', tone = 'success', duration = 6200 }) => {
      const toastId = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`

      setToasts((items) => [...items, { id: toastId, title, message, tone }].slice(-3))

      const timer = window.setTimeout(() => {
        removeToast(toastId)
      }, duration)

      toastTimersRef.current.set(toastId, timer)
    },
    [removeToast],
  )

  const stopSpeech = useCallback((status = '') => {
    if (speechStopTimerRef.current) {
      window.clearTimeout(speechStopTimerRef.current)
      speechStopTimerRef.current = null
    }

    cancelSpeechQueue()
    speechStopTimerRef.current = window.setTimeout(() => {
      cancelSpeechQueue()
      speechStopTimerRef.current = null
    }, 80)

    if (status) {
      setReaderStatus(status)
    }
  }, [])

  useEffect(() => {
    syncAppViewportHeight()

    const visualViewport = window.visualViewport
    window.addEventListener('resize', syncAppViewportHeight)
    window.addEventListener('orientationchange', syncAppViewportHeight)
    visualViewport?.addEventListener('resize', syncAppViewportHeight)

    return () => {
      window.removeEventListener('resize', syncAppViewportHeight)
      window.removeEventListener('orientationchange', syncAppViewportHeight)
      visualViewport?.removeEventListener('resize', syncAppViewportHeight)
    }
  }, [])

  useEffect(() => {
    return watchAdminSession(activeRestaurantId, (session) => {
      if (adminRegistrationPendingRef.current && session.user && !session.isAdmin) {
        return
      }

      setAdminSession(session)

      if (session.isAdmin) {
        setAdminLoginError('')
      } else if (session.error) {
        setAdminLoginError(session.error)
      }
    })
  }, [activeRestaurantId])

  useEffect(() => {
    let cancelled = false
    const slug = activeMenuSlug || defaultRestaurantProfile.slug
    const cachedState = readCachedMenuState(restaurantId, slug)

    menuStateLoadedRef.current = false
    setMenuLoadState({
      failed: false,
      loading: shouldBlockCustomMenuPaint(slug, cachedState),
      slug,
    })

    async function hydrateMenuState() {
      const resolvedRestaurantId = await resolveRestaurantId(slug, restaurantId)
      const savedState = await loadMenuState(resolvedRestaurantId, slug)

      if (cancelled) return

      if (!savedState && isCustomMenuSlug(slug)) {
        setActiveRestaurantId(resolvedRestaurantId)
        analyticsSession.restaurantId = resolvedRestaurantId
        setCart([])
        setMenuLoadState({ failed: true, loading: false, slug })
        return
      }

      const nextState = normalizeMenuStateSnapshot(savedState, slug)
      setActiveRestaurantId(resolvedRestaurantId)
      analyticsSession.restaurantId = resolvedRestaurantId

      setRestaurantProfile(nextState.profile)
      setCategories(nextState.categories)
      setPromoItems(nextState.promoItems)
      setProducts(nextState.products)
      setSelectedProductId((currentProductId) =>
        nextState.products.some((product) => product.id === currentProductId)
          ? currentProductId
          : nextState.products[0]?.id ?? '',
      )
      setCart([])
      menuStateLoadedRef.current = true
      setMenuLoadState({ failed: false, loading: false, slug })
    }

    hydrateMenuState()

    return () => {
      cancelled = true
    }
  }, [activeMenuSlug, menuReloadToken])

  useEffect(() => {
    if (!menuStateLoadedRef.current || !adminSession.isAdmin) return undefined

    const normalizedProfile = normalizeRestaurantProfile(restaurantProfile)
    const saveTimer = window.setTimeout(() => {
      saveMenuState(
        activeRestaurantId,
        normalizedProfile.slug,
        buildMenuStateSnapshot(normalizedProfile, promoItems, products, categories),
        { remote: true },
      )
    }, 700)

    return () => window.clearTimeout(saveTimer)
  }, [adminSession.isAdmin, activeMenuSlug, activeRestaurantId, categories, products, promoItems, restaurantProfile])

  useEffect(() => {
    if (screen === 'pedido') {
      setOrderSent(false)
    }
  }, [screen])

  useEffect(() => {
    function syncRouteFromHash() {
      const nextScreen = getInitialScreen()
      const nextMenuSlug = getMenuSlugFromHash()

      setScreen(nextScreen)

      if (nextMenuSlug) {
        const cachedState = readCachedMenuState(restaurantId, nextMenuSlug)
        setMenuLoadState({
          failed: false,
          loading: shouldBlockCustomMenuPaint(nextMenuSlug, cachedState),
          slug: nextMenuSlug,
        })
        setActiveMenuSlug(nextMenuSlug)
      }

      if (nextScreen === 'categoria-pratos') {
        const categoryId = getCategoryFromHash()

        if (categoryId) {
          setActiveCategory(categoryId)
          setMenuCategorySelected(true)
        }
      }

      if (nextScreen === 'produto') {
        setSelectedProductId(getProductFromHash())
      }

      if (nextScreen === 'promocao') {
        setSelectedPromoId(getPromoFromHash())
      }
    }

    window.addEventListener('hashchange', syncRouteFromHash)

    return () => window.removeEventListener('hashchange', syncRouteFromHash)
  }, [])

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      document.querySelector('[data-screen-title="true"]')?.focus()
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [screen, selectedProductId])

  useEffect(() => {
    const toastTimers = toastTimersRef.current

    return () => {
      if (speechStopTimerRef.current) {
        window.clearTimeout(speechStopTimerRef.current)
      }

      toastTimers.forEach((timer) => window.clearTimeout(timer))
      toastTimers.clear()

      cancelSpeechQueue()
    }
  }, [])

  useEffect(() => {
    if (initialMenuEventSyncedRef.current) return

    initialMenuEventSyncedRef.current = true

    const initialMenuEvent = [...analyticsEvents]
      .reverse()
      .find((event) => event.event === 'menu_open' && event.sessionId === analyticsSession.id)

    if (initialMenuEvent) {
      persistAnalyticsEvent(initialMenuEvent)
    }
  }, [analyticsEvents, analyticsSession.id])

  function showScreen(nextScreen, hashValue = nextScreen) {
    const normalizedScreen = nextScreen === 'entrada' ? 'menu' : nextScreen
    const normalizedHash =
      normalizedScreen === 'menu' && (hashValue === 'menu' || hashValue === 'entrada')
        ? getPublicMenuHash(restaurantProfile.slug || restaurantProfile.name)
        : nextScreen === 'entrada'
          ? getPublicMenuHash(restaurantProfile.slug || restaurantProfile.name)
          : hashValue

    stopSpeech()
    setScreen(normalizedScreen)
    window.location.hash = normalizedHash
  }

  function openAdminPrincipal() {
    showScreen('admin-cardapio', getAdminPrincipalHash())
  }

  async function requestAdminAccess() {
    setAdminLoginError('')

    if (adminSession.user) {
      await logoutAdmin().catch(() => {})
      setAdminSession({ loading: false, user: null, isAdmin: false, error: '' })
    }

    showScreen('admin-cardapio', getAdminPrincipalHash())
  }

  async function handleAdminLogin({ email, password }) {
    setAdminLoginError('')
    setAdminLoginLoading(true)

    try {
      const credential = await loginAdmin(email, password)
      const adminRestaurantId = await resolveAdminRestaurantId(credential.user, activeRestaurantId)

      if (!adminRestaurantId) {
        await logoutAdmin().catch(() => {})
        throw new Error('auth/admin-permission-denied')
      }

      const adminMenuSlug = adminRestaurantId === 'tokka-foods' ? 'coco-bambu' : adminRestaurantId
      setActiveRestaurantId(adminRestaurantId)
      setActiveMenuSlug(adminMenuSlug)
      setAdminSession({ loading: false, user: credential.user, isAdmin: true, error: '' })
      trackEvent('admin_login', { email })
      pushToast({
        title: 'Login confirmado',
        message: 'Painel administrativo aberto.',
      })
      openAdminPrincipal()
    } catch (error) {
      const message = translateAdminAuthError(error)
      setAdminLoginError(message)
      pushToast({
        title: 'Nao foi possivel entrar',
        message,
        tone: 'error',
      })
    } finally {
      setAdminLoginLoading(false)
    }
  }

  async function handleAdminRegister({ username, email, password }) {
    setAdminRegisterError('')
    setAdminRegisterLoading(true)
    adminRegistrationPendingRef.current = true

    try {
      const credential = await registerAdmin(activeRestaurantId, { username, email, password })

      setAdminSession({
        loading: false,
        user: credential.user,
        isAdmin: true,
        error: '',
      })
      setAdminLoginError('')
      trackEvent('admin_register', { email })
      pushToast({
        title: 'Cadastro administrativo criado',
        message: 'Acesso liberado para editar o cardapio.',
      })
      openAdminPrincipal()
      window.setTimeout(() => {
        adminRegistrationPendingRef.current = false
      }, 1200)
    } catch (error) {
      adminRegistrationPendingRef.current = false
      const message = translateAdminAuthError(error)
      setAdminRegisterError(message)
      pushToast({
        title: 'Cadastro nao concluido',
        message,
        tone: 'error',
      })
    } finally {
      setAdminRegisterLoading(false)
    }
  }

  async function handleAdminPasswordReset(email) {
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      const message = 'Informe o email administrativo para recuperar a senha.'
      setAdminLoginError(message)
      pushToast({
        title: 'Email necessario',
        message,
        tone: 'warning',
      })
      return
    }

    setAdminLoginError('')
    setAdminPasswordResetLoading(true)

    try {
      await recoverAdminPassword(trimmedEmail)
      pushToast({
        title: 'Recuperacao enviada',
        message: 'Confira o email para redefinir a senha pelo Firebase.',
      })
    } catch (error) {
      const message = translateAdminAuthError(error)
      setAdminLoginError(message)
      pushToast({
        title: 'Nao foi possivel recuperar',
        message,
        tone: 'error',
      })
    } finally {
      setAdminPasswordResetLoading(false)
    }
  }

  async function handleAdminLogout() {
    await logoutAdmin()
    setAdminLoginError('')
    pushToast({
      title: 'Sessao encerrada',
      message: 'Voce saiu do painel administrativo.',
      tone: 'warning',
    })
    trackEvent('admin_logout')
  }

  function startMenuMode(mode) {
    setMenuMode(mode)
    showScreen('menu')

    if (mode === 'voz') {
      setVoiceReaderEnabled(true)
      speakText('Cardápio por voz ativado. Abra um prato para ouvir uma descrição detalhada.')
    }
  }

  function openProduct(product, returnScreenOverride = '') {
    setEditingCartItem(null)
    setProductReturnScreen(returnScreenOverride || (screen === 'categoria-pratos' ? 'categoria-pratos' : 'menu'))
    setSelectedProductId(product.id)
    showScreen('produto', `produto=${product.id}`)
    trackEvent('product_view', {
      productId: product.id,
      productName: product.name,
      category: product.category,
    })

    if (voiceReaderEnabled) {
      readProductIngredients(product)
    }
  }

  function openPromotion(slide) {
    if (!slide?.id) return

    if (slide.targetType === 'link' && slide.targetUrl) {
      trackEvent('promotion_link_click', {
        promoId: slide.id,
        promoTitle: slide.title ?? slide.alt ?? '',
        url: slide.targetUrl,
      })
      window.open(slide.targetUrl, '_blank', 'noopener,noreferrer')
      return
    }

    if (slide.targetType === 'product' && slide.productId) {
      const promoProduct = products.find((product) => product.id === slide.productId)

      if (promoProduct) {
        trackEvent('promotion_product_click', {
          promoId: slide.id,
          productId: promoProduct.id,
          productName: promoProduct.name,
        })
        openProduct(promoProduct, 'menu')
        return
      }
    }

    setSelectedPromoId(slide.id)
    showScreen('promocao', `promocao=${slide.id}`)
    trackEvent('promotion_view', {
      promoId: slide.id,
      promoTitle: slide.title ?? slide.alt ?? '',
    })
  }

  function toggleFavoriteProduct(productId) {
    const product = products.find((item) => item.id === productId)
    const willFavorite = !favoriteProductIds.includes(productId)

    setFavoriteProductIds((items) =>
      items.includes(productId)
        ? items.filter((item) => item !== productId)
        : [...items, productId],
    )
    setReaderStatus(`${product?.name ?? 'Prato'} ${willFavorite ? 'favoritado' : 'removido dos favoritos'}.`)
  }

  function addToCart(productId, quantity = 1, note = '', option = null) {
    const product = products.find((item) => item.id === productId)
    const optionId = option?.id ?? ''
    setOrderSent(false)

    setCart((items) => {
      const existing = items.find(
        (item) => item.productId === productId && item.note === note && item.optionId === optionId,
      )

      if (existing) {
        return items.map((item) =>
          item.productId === productId && item.note === note && item.optionId === optionId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      }

      return [
        ...items,
        {
          productId,
          quantity,
          note,
          optionId,
          optionLabel: option?.label ?? '',
          optionDetail: option?.detail ?? '',
          people: option?.people ?? null,
          unitPrice: option?.price ?? product?.price ?? 0,
        },
      ]
    })

    setReaderStatus(`${product?.name ?? 'Item'} adicionado ao pedido.`)
    trackEvent('product_add', {
      productId,
      productName: product?.name ?? '',
      quantity,
      hasNote: Boolean(note),
      optionId,
    })
  }

  function updateCartItem(productId, quantity, optionId = '', note = '') {
    setCart((items) =>
      items
        .map((item) =>
          item.productId === productId && item.optionId === optionId && item.note === note
            ? { ...item, quantity }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  async function handleAdminCredentialsChange(payload) {
    try {
      await changeAdminCredentials(activeRestaurantId, payload)
      pushToast({ title: 'Acesso atualizado', message: 'Seu novo email e senha já podem ser usados.' })
      return true
    } catch (error) {
      pushToast({ title: 'Não foi possível alterar o acesso', message: translateAdminAuthError(error), tone: 'error' })
      return false
    }
  }

  async function handleCreateRestaurant(payload) {
    const slug = slugifyMenuName(payload.name)
    const profile = normalizeRestaurantProfile({
      ...defaultRestaurantProfile,
      name: payload.name.trim(),
      slug,
    })

    try {
      await createRestaurantWithAdmin({
        ownerRestaurantId: activeRestaurantId,
        ...payload,
        slug,
        menuState: buildMenuStateSnapshot(profile, promoItems, products, categories),
      })
      const publicUrl = buildPublicMenuUrl(slug)
      pushToast({ title: 'Restaurante criado', message: `O novo cardápio está disponível em ${publicUrl}` })
      return { slug, publicUrl }
    } catch (error) {
      pushToast({ title: 'Não foi possível criar o restaurante', message: translateAdminAuthError(error), tone: 'error' })
      return null
    }
  }

  function openCartItemEditor(item) {
    setEditingCartItem(item)
    setProductReturnScreen('pedido')
    setSelectedProductId(item.productId)
    showScreen('produto', `produto=${item.productId}`)
  }

  function saveCartItemEdit(selectedOption, note) {
    if (!editingCartItem) return

    setCart((items) =>
      items.map((item) =>
        item.productId === editingCartItem.productId &&
        item.optionId === editingCartItem.optionId &&
        item.note === editingCartItem.note
          ? {
              ...item,
              note,
              optionId: selectedOption?.id ?? '',
              optionLabel: selectedOption?.label ?? '',
              optionDetail: selectedOption?.detail ?? '',
              people: selectedOption?.people ?? null,
              unitPrice: selectedOption?.price ?? item.unitPrice,
            }
          : item,
      ),
    )
    setEditingCartItem(null)
    setOrderSent(false)
    showScreen('pedido')
  }

  function addAdminItem(item) {
    setProducts((items) => [...items, { ...item, active: true }])
    setActiveCategory(item.category)
    setMenuCategorySelected(true)
    trackEvent('admin_item_created', {
      productId: item.id,
      productName: item.name,
      category: item.category,
    })
  }

  function updateProduct(updatedProduct) {
    setProducts((items) =>
      items.map((item) =>
        item.id === updatedProduct.id ? { ...item, ...updatedProduct } : item,
      ),
    )
    setCart((items) =>
      items.map((item) => {
        if (item.productId !== updatedProduct.id) return item

        const updatedOption = updatedProduct.options?.find((option) => option.id === item.optionId)
        return {
          ...item,
          optionLabel: updatedOption?.label ?? item.optionLabel,
          optionDetail: updatedOption?.detail ?? item.optionDetail,
          people: updatedOption?.people ?? item.people,
          unitPrice: updatedOption?.price ?? updatedProduct.price,
        }
      }),
    )
    trackEvent('admin_item_updated', {
      productId: updatedProduct.id,
      productName: updatedProduct.name,
      category: updatedProduct.category,
    })
  }

  function toggleProductActive(productId) {
    setProducts((items) =>
      items.map((item) =>
        item.id === productId ? { ...item, active: item.active === false } : item,
      ),
    )
    trackEvent('admin_item_status_changed', { productId })
  }

  function removeProduct(productId) {
    const product = products.find((item) => item.id === productId)

    setProducts((items) => items.filter((item) => item.id !== productId))
    setCart((items) => items.filter((item) => item.productId !== productId))
    trackEvent('admin_item_removed', {
      productId,
      productName: product?.name ?? '',
      category: product?.category ?? '',
    })
  }

  async function copyNfcLink() {
    try {
      await navigator.clipboard?.writeText(generatedNfcLink)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  function openNfcPreview() {
    window.history.replaceState(null, '', `?mesa=${nfcTable || '01'}#${getPublicMenuHash(restaurantProfile.slug)}`)
    setTableNumber(nfcTable || '01')
    trackEvent('card_preview', { tableNumber: nfcTable || '01' })
    showScreen('menu')
  }

  function changeCategory(categoryId) {
    setActiveCategory(categoryId)
    setMenuCategorySelected(true)
    setSearchQuery('')
    trackEvent('category_view', { category: categoryId })
  }

  function openCategoryProducts(categoryId) {
    setActiveCategory(categoryId)
    setMenuCategorySelected(true)
    setSearchQuery('')
    trackEvent('category_view', { category: categoryId, source: 'categories_screen' })
    showScreen('categoria-pratos', `categoria=${categoryId}`)
  }

  function changeSearchQuery(value, source = 'typing') {
    setSearchQuery(value)

    if (value.trim().length >= 3) {
      trackEvent(source === 'voice' ? 'voice_search' : 'search', {
        query: value.trim(),
      })
    }
  }

  function openPartnerLink(partner, url) {
    trackEvent(`${partner}_click`, { url })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function openVezz() {
    speakText('Abrindo a Vezz Mobilidade.')
    openPartnerLink('vezz', partnerLinks.vezz)
  }

  function startVoiceCommand() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!Recognition) {
      speakText('Este navegador ainda não permite comandos de voz.')
      return
    }

    const recognition = new Recognition()
    recognition.lang = 'pt-BR'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setVoiceCommandListening(true)
      setReaderStatus('Agora estamos te ouvindo.')
    }

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? ''
      handleVoiceCommand(transcript)
    }

    recognition.onerror = () => {
      setReaderStatus('Não consegui ouvir o comando. Tente novamente.')
    }

    recognition.onend = () => {
      setVoiceCommandListening(false)
    }

    recognition.start()
  }

  function handleVoiceCommand(transcript) {
    const command = transcript.trim()
    const normalizedCommand = normalizeText(command)

    if (!command) return

    trackEvent('voice_command', { command })

    if (normalizedCommand.includes('voltar')) {
      showScreen('menu')
      speakText('Voltando para o cardápio.')
      return
    }

    if (normalizedCommand.includes('vezz') || normalizedCommand.includes('corrida')) {
      openVezz()
      return
    }

    const category = categories.find((item) =>
      normalizeText(`${item.label} ${item.shortLabel}`).includes(normalizedCommand) ||
      normalizedCommand.includes(normalizeText(item.shortLabel)),
    )

    if (category) {
      changeCategory(category.id)
      speakText(`Mostrando ${category.label}.`)
      return
    }

    const matchedProduct = findProductByCommand(menuProducts, normalizedCommand)

    if (normalizedCommand.includes('quanto custa') && matchedProduct) {
      speakText(`${matchedProduct.name} custa ${formatCurrency(matchedProduct.price)}.`)
      return
    }

    if (
      normalizedCommand.includes('abrir') &&
      matchedProduct
    ) {
      openProduct(matchedProduct)
      return
    }

    if (normalizedCommand.includes('vegetariana') || normalizedCommand.includes('vegetariano')) {
      changeSearchQuery('vegetariano', 'voice')
      speakText('Mostrando opções vegetarianas.')
      return
    }

    changeSearchQuery(command, 'voice')
    speakText(`Pesquisando por ${command}.`)
  }

  function toggleVoiceReader() {
    const nextValue = !voiceReaderEnabled

    setVoiceReaderEnabled(nextValue)

    if (nextValue) {
      speakText('Leitor automático ativado. Ao abrir um item, vou descrever a comida com mais detalhes.')
      return
    }

    stopSpeech('Leitor automático desativado.')
  }

  function readProductIngredients(product) {
    speakText(buildProductSpeech(product))
  }

  function speakText(message) {
    setReaderStatus(message)

    if (
      typeof window === 'undefined' ||
      !window.speechSynthesis ||
      !window.SpeechSynthesisUtterance
    ) {
      setReaderStatus('Leitura por voz indisponível neste navegador.')
      return
    }

    if (speechStopTimerRef.current) {
      window.clearTimeout(speechStopTimerRef.current)
      speechStopTimerRef.current = null
    }

    cancelSpeechQueue()

    const utterance = new window.SpeechSynthesisUtterance(prepareSpeechText(message))
    utterance.lang = 'pt-BR'
    utterance.rate = 0.92
    utterance.pitch = 1
    utterance.onerror = () => setReaderStatus('Não foi possível iniciar a leitura por voz.')

    window.speechSynthesis.speak(utterance)
  }

  function sendOrder(orderData = {}) {
    const orderRecord = buildOrderRecord({
      analyticsSession,
      cartItems,
      cartTotal,
      orderData,
      tableNumber,
    })

    setOrderSent(true)
    setReaderStatus(`Pedido enviado para a mesa ${tableNumber || 'selecionada'}.`)
    persistOrder(orderRecord)
    trackEvent('order_sent', {
      orderId: orderRecord.id,
      tableNumber: tableNumber || '',
      serviceType: orderData.serviceType ?? 'mesa',
      paymentType: orderData.paymentType ?? 'caixa',
      hasCustomerName: Boolean(orderData.customerName?.trim()),
      cartQuantity,
      cartTotal,
    })
  }

  return (
    <main
      aria-label={menuPlaceholderActive ? 'Cardapio digital' : `Cardapio digital ${restaurantProfile.name}`}
      className="app-main bg-slate-100 text-slate-950"
    >
      <div
        className={`app-shell brand-theme overflow-hidden ${
          screen === 'entrada' ? 'bg-[#45150d]' : 'bg-white'
        }`}
        style={buildThemeStyle(restaurantProfile)}
      >
        {menuPlaceholderActive && (
          <MenuLoadingScreen
            failed={menuLoadState.failed}
            onRetry={() => {
              const slug = activeMenuSlug || defaultRestaurantProfile.slug
              setMenuLoadState({ failed: false, loading: isCustomMenuSlug(slug), slug })
              setMenuReloadToken((currentToken) => currentToken + 1)
            }}
          />
        )}

        {!menuPlaceholderActive && screen === 'entrada' && (
          <EntryScreen onStart={startMenuMode} />
        )}

        {!menuPlaceholderActive && screen === 'menu' && (
          <MenuScreen
            products={menuProducts}
            categories={categories}
            activeCategory={activeCategory}
            menuCategorySelected={menuCategorySelected}
            cartQuantity={cartQuantity}
            cartTotal={cartTotal}
            menuMode={menuMode}
            promoItems={promoItems}
            restaurantProfile={restaurantProfile}
            searchQuery={searchQuery}
            tableNumber={tableNumber}
            onBack={() => showScreen('entrada')}
            onCategoryChange={(categoryId) => openCategoryProducts(categoryId)}
            onSearchChange={changeSearchQuery}
            onOpenCategories={() => showScreen('categorias')}
            onOpenSettings={requestAdminAccess}
            onOpenProduct={openProduct}
            onAddToCart={addToCart}
            onOpenOrder={() => {
              setOrderSent(false)
              showScreen('pedido')
            }}
            onOpenPromotion={openPromotion}
            onOpenVezz={openVezz}
            onStartVoiceCommand={startVoiceCommand}
            onToggleVoiceReader={toggleVoiceReader}
            voiceCommandListening={voiceCommandListening}
            voiceReaderEnabled={voiceReaderEnabled}
          />
        )}

        {!menuPlaceholderActive && screen === 'categorias' && (
          <CategoriesScreen
            categories={categories}
            restaurantProfile={restaurantProfile}
            onBack={() => showScreen('menu')}
            onOpenSettings={requestAdminAccess}
            onSelectCategory={openCategoryProducts}
          />
        )}

        {!menuPlaceholderActive && screen === 'categoria-pratos' && (
          <CategoryProductsScreen
            category={categories.find((category) => category.id === activeCategory) ?? categories[0]}
            products={menuProducts.filter((product) => product.category === activeCategory)}
            restaurantProfile={restaurantProfile}
            onBack={() => showScreen('categorias')}
            onOpenProduct={openProduct}
            onOpenSettings={requestAdminAccess}
          />
        )}

        {!menuPlaceholderActive && screen === 'produto' && (
          <ProductScreen
            key={selectedProduct.id}
            product={selectedProduct}
            restaurantProfile={restaurantProfile}
            editingCartItem={editingCartItem}
            onBack={() => {
              if (productReturnScreen === 'promocao') {
                showScreen('promocao', `promocao=${selectedPromoId}`)
                return
              }

              if (productReturnScreen === 'categoria-pratos') {
                showScreen('categoria-pratos', `categoria=${activeCategory}`)
                return
              }

              if (productReturnScreen === 'pedido') {
                setEditingCartItem(null)
                showScreen('pedido')
                return
              }

              showScreen('menu')
            }}
            onAddToCart={addToCart}
            onAdded={() => showScreen('menu')}
            onSaveCartItem={saveCartItemEdit}
            onOpenSettings={requestAdminAccess}
          />
        )}

        {!menuPlaceholderActive && screen === 'promocao' && (
          <PromotionScreen
            promo={selectedPromo}
            restaurantProfile={restaurantProfile}
            onBack={() => showScreen('menu')}
            onOpenProduct={(productId) => {
              const promoProduct = products.find((product) => product.id === productId) ?? selectedProduct

              openProduct(promoProduct, 'promocao')
            }}
          />
        )}

        {screen === 'configuracoes' && !adminSession.isAdmin && (
          <AdminLoginScreen
            defaultEmail={defaultAdminEmail}
            error={adminLoginError}
            loading={adminLoginLoading || adminSession.loading}
            recoveryLoading={adminPasswordResetLoading}
            onBack={() => showScreen('menu')}
            onLogin={handleAdminLogin}
            onRecoverPassword={handleAdminPasswordReset}
          />
        )}

        {screen === 'configuracoes' && adminSession.isAdmin && (
          <SettingsScreen
            adminEmail={adminSession.user?.email ?? ''}
            copied={copied}
            nfcTable={nfcTable}
            categories={categories}
            products={products}
            analyticsSummary={analyticsSummary}
            generatedNfcLink={generatedNfcLink}
            onBack={() => showScreen('menu')}
            onAddAdminItem={addAdminItem}
            onCopyNfcLink={copyNfcLink}
            onNfcTableChange={setNfcTable}
            onOpenNfcPreview={openNfcPreview}
            onOpenPartnerLink={openPartnerLink}
            onLogout={handleAdminLogout}
            onOpenMenuEditor={openAdminPrincipal}
            onChangeCredentials={handleAdminCredentialsChange}
            onCreateRestaurant={handleCreateRestaurant}
          />
        )}

        {screen === 'admin-cardapio' && !adminSession.isAdmin && (
          <AdminLoginScreen
            defaultEmail={defaultAdminEmail}
            error={adminLoginError}
            loading={adminLoginLoading || adminSession.loading}
            recoveryLoading={adminPasswordResetLoading}
            onBack={() => showScreen('menu')}
            onLogin={handleAdminLogin}
            onRecoverPassword={handleAdminPasswordReset}
          />
        )}

        {screen === 'cadastro-administrador' && (
          <AdminRegisterScreen
            defaultEmail={defaultAdminEmail}
            error={adminRegisterError}
            loading={adminRegisterLoading}
            onBack={openAdminPrincipal}
            onRegister={handleAdminRegister}
          />
        )}

        {screen === 'admin-cardapio' && adminSession.isAdmin && (
          <AdminMenuEditor
            categories={categories}
            products={products}
            promoItems={promoItems}
            restaurantProfile={restaurantProfile}
            onUpdateProfile={(nextProfile) => setRestaurantProfile(normalizeRestaurantProfile(nextProfile))}
            onAddAdminItem={addAdminItem}
            onBack={() => showScreen('menu')}
            onDone={(nextProfile) => {
              if (nextProfile) {
                const normalizedProfile = normalizeRestaurantProfile(nextProfile)

                setActiveMenuSlug(normalizedProfile.slug)
                setRestaurantProfile(normalizedProfile)
                saveMenuState(
                  activeRestaurantId,
                  normalizedProfile.slug,
                  buildMenuStateSnapshot(normalizedProfile, promoItems, products, categories),
                  { remote: adminSession.isAdmin },
                )
                showScreen('menu', getPublicMenuHash(normalizedProfile.slug))
                return
              }
              showScreen('menu')
            }}
            onRemoveProduct={removeProduct}
            onToggleProductActive={toggleProductActive}
            onUpdateCategories={setCategories}
            onUpdatePromos={setPromoItems}
            onUpdateProduct={updateProduct}
          />
        )}

        {!menuPlaceholderActive && screen === 'pedido' && (
          <OrderScreen
            cartItems={cartItems}
            cartTotal={cartTotal}
            orderSent={orderSent}
            restaurantProfile={restaurantProfile}
            tableNumber={tableNumber}
            onBack={() => showScreen('menu')}
            onEditCartItem={openCartItemEditor}
            onFinishOrder={() => {
              setOrderSent(false)
              setCart([])
              showScreen('menu')
            }}
            onSendOrder={sendOrder}
            onTableChange={setTableNumber}
            onUpdateCartItem={updateCartItem}
          />
        )}

        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {readerStatus}
        </p>
        <ToastStack toasts={toasts} onDismiss={removeToast} />
      </div>
    </main>
  )
}

function MenuLoadingScreen({ failed = false, onRetry }) {
  return (
    <section
      aria-busy={!failed}
      className="grid h-full place-items-center bg-white px-8 text-center text-slate-950"
    >
      <div className="grid max-w-[280px] justify-items-center gap-5">
        <div className="grid size-16 place-items-center rounded-full bg-slate-950 text-white shadow-lg shadow-slate-200">
          <ReceiptText size={30} strokeWidth={1.9} />
        </div>
        <div>
          <h1 data-screen-title="true" tabIndex={-1} className="text-xl font-black uppercase outline-none">
            {failed ? 'Cardapio indisponivel' : 'Carregando cardapio'}
          </h1>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            {failed
              ? 'Nao foi possivel carregar este restaurante agora.'
              : 'Preparando as informacoes do restaurante.'}
          </p>
        </div>
        {failed && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-black text-white transition active:scale-95"
          >
            <RefreshCw size={17} strokeWidth={2.5} />
            Tentar novamente
          </button>
        )}
      </div>
    </section>
  )
}

function EntryScreen({ onStart }) {
  return (
    <section className="relative h-full overflow-hidden bg-[#46160f] px-14 text-[#d7ac5f]">
      <div className="absolute -right-20 top-0 size-60 rounded-full border border-[#8e6035]/20" />
      <div className="absolute -bottom-20 -left-24 size-72 rounded-full border border-[#8e6035]/20" />
      <div className="flex h-full flex-col items-center justify-center gap-10">
        <img
          src={cocoLogo}
          alt="Coco Bambu"
          loading="eager"
          decoding="sync"
          className="w-[250px]"
          draggable="false"
        />
        <div className="grid w-full gap-9">
          {[
            ['padrao', 'CARDÁPIO PADRÃO'],
            ['voz', 'CARDÁPIO POR VOZ'],
            ['simplificado', 'CARDÁPIO SIMPLIFICADO'],
          ].map(([mode, label]) => (
            <button
              type="button"
              key={mode}
              onClick={() => onStart(mode)}
              className="h-[72px] rounded-[30px] bg-[#d8ad61] text-base font-medium text-black shadow-[0_6px_0_rgba(93,47,18,0.65)] transition active:translate-y-1 active:shadow-none"
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-base font-medium">@cocobambuoficial</p>
      </div>
    </section>
  )
}

function CategoriesScreen({ categories, restaurantProfile = defaultRestaurantProfile, onBack, onOpenSettings, onSelectCategory }) {
  return (
    <section className="h-full overflow-y-auto bg-white pb-8 text-[#43160f]">
      <TopPhotoBar backgroundImage={restaurantProfile.cover} onBack={onBack} onOpenSettings={onOpenSettings} compact />
      <div className="relative z-10 -mt-8 rounded-t-[34px] bg-white px-4 pb-8 pt-10 shadow-[0_-14px_34px_rgba(67,22,15,0.10)]">
        <img
          src={restaurantProfile.logo}
          alt={restaurantProfile.name}
          loading="eager"
          decoding="sync"
          className="absolute left-1/2 top-[-70px] z-20 size-[96px] -translate-x-1/2 rounded-full bg-[#4a160f]"
        />
        <h1 data-screen-title="true" tabIndex={-1} className="font-anton text-center text-[17px] font-normal leading-none outline-none">
          CATEGORIAS
        </h1>
        <div className="mt-6 grid grid-cols-2 gap-x-2 gap-y-0">
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className="text-center transition active:scale-[0.99]"
            >
              <span className="relative block">
                <span className="block aspect-[1.47] overflow-hidden rounded-lg border-[3px] border-[#4b160e] bg-[#4b160e]">
                  <img
                    src={category.image}
                    alt=""
                    loading="eager"
                    decoding="sync"
                    className="block size-full scale-[1.04] object-cover object-center"
                  />
                </span>
                <img
                  src={category.iconImage}
                  alt=""
                  className="absolute bottom-[-17px] left-1/2 z-10 size-[48px] -translate-x-1/2 object-contain"
                  draggable="false"
                />
              </span>
              <span className="font-montserrat mt-5 flex min-h-5 items-start justify-center text-center text-[12px] font-semibold leading-tight">
                {category.label.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function CategoryProductsScreen({ category, products, restaurantProfile = defaultRestaurantProfile, onBack, onOpenProduct, onOpenSettings }) {
  const groupedProducts = groupProductsByMenuSection(products, category)

  return (
    <section className="h-full overflow-y-auto bg-white pb-8 text-[#43160f]" aria-labelledby="category-products-title">
      <TopPhotoBar backgroundImage={restaurantProfile.cover} onBack={onBack} onOpenSettings={onOpenSettings} compact />

      <div className="relative z-10 -mt-8 rounded-t-[34px] bg-white px-4 pb-8 pt-[60px] shadow-[0_-14px_34px_rgba(67,22,15,0.10)]">
        <div className="absolute left-1/2 top-[-68px] grid size-[92px] -translate-x-1/2 place-items-center">
          <img
            src={category.iconImage}
            alt=""
            className="block size-[92px] object-contain"
          />
        </div>

        <h1
          id="category-products-title"
          data-screen-title="true"
          tabIndex={-1}
          className="font-anton -translate-y-7 text-center text-[21px] font-normal tracking-[0.02em] outline-none"
        >
          {category.label.toUpperCase()}
        </h1>

        <div className="-mt-2 space-y-5">
          {groupedProducts.length ? (
            groupedProducts.map((group) => (
              <section key={group.title}>
                {normalizeText(group.title) !== normalizeText(category.label) && (
                  <h2 className="mb-2 min-h-[20px] px-1 text-[17px] font-black">
                    {group.title}
                  </h2>
                )}
                <div className="space-y-2.5">
                  {group.products.map((product) => (
                    <CategoryDishCard
                      key={product.id}
                      product={product}
                      onOpen={() => onOpenProduct(product)}
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <p className="rounded-lg bg-[#f0f0f0] p-4 text-sm font-bold text-[#7d6259]">
              Nenhum prato cadastrado nesta categoria.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function CategoryDishCard({ product, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={buildProductAriaLabel(product)}
      className="grid h-[116px] w-full grid-cols-[1fr_130px] gap-3 overflow-hidden rounded-lg bg-[#f0f0f0] p-3 text-left"
    >
      <span className="grid min-w-0 grid-rows-[auto_1fr_auto] self-stretch overflow-hidden">
        <span className="block truncate text-[13px] font-bold leading-tight" title={product.name}>
          {product.name.toUpperCase()}
        </span>
        <span className="line-clamp-3 block max-h-[51px] self-center overflow-hidden text-[12.5px] font-normal leading-[17px]">
          {product.description}
        </span>
        <span className="block text-[13px] font-bold">{formatCurrency(product.price)}</span>
      </span>
      <span className="brand-photo-frame relative block h-[90px] self-center overflow-hidden rounded-lg bg-[#4b160e]">
        <ImageWithFallback
          src={product.image}
          fallbackSrc={fallbackImages[product.category] || categoriaFrutosDoMar}
          alt=""
          className="block size-full scale-[1.03] object-cover"
        />
        <span className="absolute bottom-2 right-2 flex h-5 items-center justify-center whitespace-nowrap rounded-full bg-white/95 px-2 text-[7.5px] font-black leading-none text-[#4b160e] shadow-[0_2px_8px_rgba(67,22,15,0.16)]">
          VER PRATO &gt;
        </span>
      </span>
    </button>
  )
}

function TopPhotoBar({
  backgroundImage = cocoBackground,
  onBack,
  onOpenSettings,
  trailingIcon = 'settings',
  trailingActive = false,
  showBack = true,
}) {
  return (
    <div className="relative h-[144px] overflow-hidden">
      <ImageWithFallback src={backgroundImage} fallbackSrc={cocoBackground} alt="" className="h-full w-full object-cover" draggable="false" />
      <div className="absolute inset-0 bg-black/10" />
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="absolute left-7 top-4 grid size-9 place-items-center rounded-full bg-white/85 text-[var(--brand-primary)] shadow-lg shadow-black/15 ring-1 ring-white/70 transition active:scale-95"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
      )}
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label={trailingIcon === 'heart' ? (trailingActive ? 'Remover dos favoritos' : 'Favoritar') : 'Configurações'}
        className="absolute right-7 top-4 grid size-9 place-items-center rounded-full bg-white/85 text-[var(--brand-primary)] shadow-lg shadow-black/15 ring-1 ring-white/70 transition active:scale-95"
      >
        {trailingIcon === 'heart' ? (
          <Heart size={25} strokeWidth={2.6} fill={trailingActive ? 'var(--brand-primary)' : 'none'} />
        ) : (
          <Settings size={20} strokeWidth={2} />
        )}
      </button>
    </div>
  )
}

function ImageWithFallback({ src, fallbackSrc, alt = '', onError, ...props }) {
  const resolvedFallback = hydrateImageSource(fallbackSrc, '')
  const resolvedSource = hydrateImageSource(src, resolvedFallback)
  const [failedSource, setFailedSource] = useState('')
  const currentSource = failedSource === resolvedSource
    ? resolvedFallback
    : resolvedSource || resolvedFallback

  function handleError(event) {
    onError?.(event)

    if (resolvedFallback && currentSource !== resolvedFallback) {
      setFailedSource(resolvedSource)
    }
  }

  return <img src={currentSource || resolvedFallback} alt={alt} onError={handleError} {...props} />
}

function MenuScreen({
  products,
  categories,
  activeCategory,
  menuCategorySelected,
  cartQuantity,
  cartTotal,
  menuMode,
  promoItems = promoSlides,
  restaurantProfile = defaultRestaurantProfile,
  searchQuery,
  onBack,
  onCategoryChange,
  onSearchChange,
  onOpenCategories,
  onOpenSettings,
  onOpenProduct,
  onOpenOrder,
  onOpenPromotion,
  onOpenVezz,
  onStartVoiceCommand,
  voiceCommandListening,
}) {
  const [promoIndex, setPromoIndex] = useState(0)
  const [productLayout, setProductLayout] = useState('lista')
  const [menuSheetRaised, setMenuSheetRaised] = useState(false)
  const menuScrollRef = useRef(null)
  const categoryStripRef = useRef(null)
  const productSearch = searchProducts(products, searchQuery)
  const visibleProducts = productSearch.items
  const isSearching = Boolean(normalizeText(searchQuery))
  const selectedCategory = categories.find((category) => category.id === activeCategory) ?? categories[0]
  const categoryProducts = visibleProducts.filter((product) => product.category === activeCategory)
  const featuredProducts = visibleProducts.slice(0, menuMode === 'simplificado' ? 4 : 5)
  const primaryProducts = isSearching ? visibleProducts : featuredProducts
  const selectedDailySource = menuCategorySelected && categoryProducts.length ? categoryProducts : visibleProducts
  const dailyProducts = selectedDailySource
    .filter((product) => !featuredProducts.some((featuredProduct) => featuredProduct.id === product.id))
    .slice(0, menuMode === 'simplificado' ? 2 : 4)
  const menuSectionTitle = isSearching
    ? productSearch.mode === 'similar'
      ? 'SIMILARES'
      : 'RESULTADOS'
    : 'DESTAQUES'
  const safePromoIndex = promoItems.length ? Math.min(promoIndex, promoItems.length - 1) : 0

  useEffect(() => {
    if (!promoItems.length) return undefined

    const intervalId = window.setInterval(() => {
      setPromoIndex((currentIndex) => (currentIndex + 1) % promoItems.length)
    }, 5200)

    return () => window.clearInterval(intervalId)
  }, [promoItems.length])

  useEffect(() => {
    const categoryStrip = categoryStripRef.current
    if (!categoryStrip) return undefined

    function forwardVerticalWheel(event) {
      if (event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return

      event.preventDefault()
      menuScrollRef.current?.scrollBy({ top: event.deltaY, behavior: 'auto' })
    }

    categoryStrip.addEventListener('wheel', forwardVerticalWheel, { passive: false })
    return () => categoryStrip.removeEventListener('wheel', forwardVerticalWheel)
  }, [])

  function handleMenuScroll(event) {
    const nextValue = event.currentTarget.scrollTop > 24
    setMenuSheetRaised((currentValue) => (currentValue === nextValue ? currentValue : nextValue))
  }

  return (
    <section
      ref={menuScrollRef}
      className="relative h-full overflow-y-auto bg-white pb-28 text-[var(--brand-primary)]"
      aria-labelledby="menu-title"
      onScroll={handleMenuScroll}
    >
      <div className="sticky top-0 z-0">
        <TopPhotoBar
          backgroundImage={restaurantProfile.cover}
          onBack={onBack}
          onOpenSettings={onOpenSettings}
          showBack={false}
        />
      </div>

      <ImageWithFallback
        src={restaurantProfile.logo}
        fallbackSrc={cocoLogo}
        alt={restaurantProfile.name}
        loading="eager"
        decoding="sync"
        className={`pointer-events-none absolute left-1/2 top-[50px] size-[96px] -translate-x-1/2 rounded-full bg-[var(--brand-primary)] object-cover transition-all duration-500 ease-out ${
          menuSheetRaised ? 'z-0 -translate-y-5 opacity-0 scale-95' : 'z-30 translate-y-0 opacity-100 scale-100'
        }`}
        draggable="false"
      />

      <div className="relative z-20 -mt-8 rounded-t-[34px] bg-[var(--brand-surface)] px-8 pb-4 pt-[48px] shadow-[0_-18px_42px_rgba(67,22,15,0.12)]">
        <div className="text-center">
          <h1 id="menu-title" data-screen-title="true" tabIndex={-1} className="font-anton text-[25px] font-normal uppercase tracking-[0.02em] outline-none">
            {restaurantProfile.name}
          </h1>
          <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-[#4b231b]">
            <MapPin size={12} fill="#111" />
            {restaurantProfile.location}
          </p>
        </div>

        <div className="-mx-8 mt-3">
          <PromoCarousel
            activeIndex={safePromoIndex}
            slides={promoItems}
            onSelect={setPromoIndex}
            onOpenPromo={onOpenPromotion}
            onOpenVezz={onOpenVezz}
          />
        </div>

        <div className="relative mt-2.5 h-10 overflow-hidden rounded-full border border-[#e8e3e1] bg-white">
          <Search size={18} strokeWidth={1.6} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a99d99]" />
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar pratos"
            className="h-full w-full min-w-0 bg-transparent pl-11 pr-20 text-[14px] font-normal text-[#43160f] outline-none placeholder:font-normal placeholder:text-[#a99d99]"
          />
          {isSearching && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Limpar busca"
              className="absolute right-12 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-white text-[#8f7d77] shadow-sm"
            >
              <X size={16} strokeWidth={2.7} />
            </button>
          )}
          <button
            type="button"
            onClick={onStartVoiceCommand}
            aria-label="Buscar por voz"
            aria-pressed={voiceCommandListening}
            className={`absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center overflow-hidden rounded-full transition ${
              voiceCommandListening ? 'bg-[var(--brand-primary)] text-white shadow-sm' : 'text-[#bdb8b5]'
            }`}
          >
            <Mic size={18} strokeWidth={1.6} />
          </button>
        </div>

        {!isSearching && (
          <>
            <div className="mt-2.5 flex items-center justify-between">
              <h2 className="-ml-5 text-[15px] font-medium">CATEGORIAS</h2>
              <button
                type="button"
                onClick={onOpenCategories}
                className="-mr-7 inline-flex items-center gap-1 text-[12px] font-normal text-[#8f6f64] transition hover:text-[var(--brand-primary)]"
              >
                Ver todos
                <ArrowRight size={15} strokeWidth={1.6} aria-hidden="true" />
              </button>
            </div>

            <div
              ref={categoryStripRef}
              className="-mx-8 -mt-2 overflow-x-auto overflow-y-hidden pt-3 [scrollbar-width:none] [touch-action:pan-x_pinch-zoom]"
            >
              <div className="flex w-max translate-y-1.5 gap-2 px-3 pb-1">
                {categories.map((category) => (
                  <CategoryPreviewCard
                    key={category.id}
                    category={category}
                    active={menuCategorySelected && category.id === activeCategory}
                    onClick={() => onCategoryChange(category.id)}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {isSearching && (
          <div className="mt-2.5 rounded-lg bg-[#f8f3ee] px-3 py-2 text-xs font-bold leading-4 text-[#8b6d66]">
            {productSearch.mode === 'similar'
              ? `Não encontramos exatamente "${searchQuery.trim()}". Mostrando similares por ingredientes, categoria e tags.`
              : productSearch.mode === 'none'
                ? `Nenhum prato encontrado para "${searchQuery.trim()}". Tente buscar por ingrediente, categoria ou restrição.`
                : `Exibindo pratos encontrados para "${searchQuery.trim()}".`}
          </div>
        )}

        <div className="mt-1 flex items-center justify-between">
          <h2 className="-ml-5 text-[15px] font-medium">{menuSectionTitle}</h2>
          <div className="-mr-6">
            <ViewModeToggle value={productLayout} onChange={setProductLayout} />
          </div>
        </div>

        <div className={productLayout === 'grade' ? 'relative left-1/2 mt-2 grid w-[calc(100%+64px)] -translate-x-1/2 grid-cols-2 gap-2.5 px-2' : 'relative left-1/2 mt-2 w-[calc(100%+64px)] -translate-x-1/2 space-y-2.5 px-2'}>
          {primaryProducts.map((product) => (
            productLayout === 'grade' ? (
              <MenuProductGridCard key={product.id} product={product} onOpen={() => onOpenProduct(product)} />
            ) : (
              <MenuProductCard key={product.id} product={product} onOpen={() => onOpenProduct(product)} />
            )
          ))}
        </div>

        {!isSearching && dailyProducts.length > 0 && (
          <>
            <div className="mt-4 flex items-center justify-between">
              <h2 className="text-[15px] font-medium">PRATOS DO DIA</h2>
              <span className="text-[11px] font-semibold text-[#a98272]">
                {menuCategorySelected ? selectedCategory.label : 'Seleção da casa'}
              </span>
            </div>

            <div className={productLayout === 'grade' ? 'relative left-1/2 mt-2 grid w-[calc(100%+64px)] -translate-x-1/2 grid-cols-2 gap-2.5 px-2' : 'relative left-1/2 mt-2 w-[calc(100%+64px)] -translate-x-1/2 space-y-2.5 px-2'}>
              {dailyProducts.map((product) => (
                productLayout === 'grade' ? (
                  <MenuProductGridCard key={product.id} product={product} onOpen={() => onOpenProduct(product)} />
                ) : (
                  <MenuProductCard key={product.id} product={product} onOpen={() => onOpenProduct(product)} />
                )
              ))}
            </div>
          </>
        )}
      </div>

      {cartQuantity > 0 && (
        <CartBar quantity={cartQuantity} total={cartTotal} onOpenOrder={onOpenOrder} />
      )}
    </section>
  )
}

function PromoCarousel({ activeIndex, slides = promoSlides, onSelect, onOpenPromo, onOpenVezz }) {
  const carouselRef = useRef(null)
  const touchStartRef = useRef(null)
  const swipeMovedRef = useRef(false)
  const [slideWidth, setSlideWidth] = useState(316)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return undefined

    function updateSlideWidth(width) {
      setSlideWidth(Math.min(316, Math.max(286, Math.round(width * 0.735))))
    }

    updateSlideWidth(carousel.getBoundingClientRect().width)

    const observer = new ResizeObserver(([entry]) => {
      updateSlideWidth(entry.contentRect.width)
    })

    observer.observe(carousel)

    return () => observer.disconnect()
  }, [])

  function selectRelativeSlide(direction) {
    onSelect((activeIndex + direction + slides.length) % slides.length)
  }

  function getSlideOffset(index) {
    let offset = index - activeIndex

    if (offset > slides.length / 2) offset -= slides.length
    if (offset < -slides.length / 2) offset += slides.length

    return offset
  }

  function handleSlideClick(slide, index) {
    if (swipeMovedRef.current) {
      return
    }

    if (index !== activeIndex) {
      onSelect(index)
      return
    }

    if (slide.action === 'vezz') {
      onOpenVezz()
      return
    }

    onOpenPromo?.(slide)
  }

  function handleTouchStart(event) {
    const touch = event.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    swipeMovedRef.current = false
    setIsDragging(true)
    setDragOffset(0)
  }

  function handleTouchMove(event) {
    const touch = event.touches[0]
    const start = touchStartRef.current

    if (!start) return

    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y

    if (Math.abs(deltaX) > 12 && Math.abs(deltaX) > Math.abs(deltaY)) {
      swipeMovedRef.current = true
      setDragOffset(Math.max(slideWidth * -0.92, Math.min(slideWidth * 0.92, deltaX)))
    }
  }

  function handleTouchEnd(event) {
    const start = touchStartRef.current

    if (!start) return

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y
    const isHorizontalSwipe = Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15

    touchStartRef.current = null
    setIsDragging(false)
    setDragOffset(0)

    if (isHorizontalSwipe) {
      swipeMovedRef.current = true
      selectRelativeSlide(deltaX < 0 ? 1 : -1)
      window.setTimeout(() => {
        swipeMovedRef.current = false
      }, 250)
      return
    }

    if (swipeMovedRef.current) {
      window.setTimeout(() => {
        swipeMovedRef.current = false
      }, 250)
    }
  }

  function handleTouchCancel() {
    touchStartRef.current = null
    setIsDragging(false)
    setDragOffset(0)
    window.setTimeout(() => {
      swipeMovedRef.current = false
    }, 120)
  }

  if (!slides.length) return null

  return (
    <div
      ref={carouselRef}
      className="relative h-[96px] w-full touch-pan-y overflow-hidden py-[5px]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {slides.map((slide, index) => {
        const offset = getSlideOffset(index)
        const slidePosition = offset + dragOffset / slideWidth
        const distanceFromCenter = Math.abs(slidePosition)
        const isActive = offset === 0
        const slideScale = 1 - Math.min(distanceFromCenter, 1) * 0.08

        return (
          <button
            type="button"
            key={slide.id}
            onClick={() => handleSlideClick(slide, index)}
            aria-label={slide.action === 'vezz' ? 'Abrir Vezz' : slide.alt}
            aria-current={isActive}
            className={`absolute left-1/2 top-[5px] grid h-[86px] place-items-center overflow-hidden rounded-lg shadow-[0_10px_24px_rgba(67,22,15,0.10)] ${
              isDragging ? 'transition-none' : 'transition-all duration-700 ease-out'
            } ${
              slide.id === protectedPromoSlideId ? 'bg-[#15c8d0]' : 'bg-[#4b160e]'
            }`}
            style={{
              width: `${slideWidth}px`,
              transform: `translateX(calc(-50% + ${offset * slideWidth + dragOffset}px)) scale(${slideScale})`,
              opacity: distanceFromCenter > 1.35 ? 0 : 1,
              zIndex: Math.round((2 - Math.min(distanceFromCenter, 2)) * 10),
            }}
          >
            <ImageWithFallback
              src={slide.image}
              fallbackSrc={slide.id === protectedPromoSlideId ? slideVezzBanner : promoShrimp}
              alt={slide.alt}
              className={`h-full w-full ${slide.fit === 'cover' ? 'object-cover' : 'object-contain'}`}
              draggable="false"
            />
          </button>
        )
      })}
    </div>
  )
}

function CategoryPreviewCard({ category, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="min-h-[98px] w-[calc((min(100vw,430px)-48px)/3)] flex-none text-center"
    >
      <span
        className={`brand-photo-frame block h-[84px] overflow-hidden rounded-md bg-[#4b160e] transition ${
          active ? 'ring-2 ring-[#4b160e] ring-offset-2 ring-offset-white' : ''
        }`}
      >
        <ImageWithFallback
          src={category.image}
          fallbackSrc={fallbackImages[category.id] || categoriaEntradas}
          alt=""
          loading="eager"
          decoding="sync"
          className="block size-full scale-[1.08] object-cover object-center"
        />
      </span>
      <span className="font-montserrat mt-2 flex h-7 items-start justify-center px-1 text-center text-[11px] font-semibold leading-[1.2] tracking-[0.01em]">
        {category.label.toUpperCase()}
      </span>
    </button>
  )
}

function ViewModeToggle({ value, onChange }) {
  const options = [
    { id: 'lista', label: 'Visualizar em lista', icon: List },
    { id: 'grade', label: 'Visualizar em grade', icon: LayoutGrid },
  ]

  return (
    <div className="flex items-center gap-1" aria-label="Modo de visualização">
      {options.map(({ id, label, icon: Icon }) => {
        const active = value === id

        return (
          <button
            type="button"
            key={id}
            onClick={() => onChange(id)}
            aria-label={label}
            aria-pressed={active}
            title={label}
            className={`grid size-8 place-items-center rounded-full transition-colors duration-200 ${
              active ? 'bg-[#4b160e] text-white' : 'bg-transparent text-[#ad9d97] hover:bg-[#f5f1ef] hover:text-[#6f4a41]'
            }`}
          >
            <Icon size={16} strokeWidth={active ? 1.9 : 1.6} />
          </button>
        )
      })}
    </div>
  )
}

function MenuProductCard({ product, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={buildProductAriaLabel(product)}
      className="grid h-[116px] w-full grid-cols-[1fr_130px] gap-3 overflow-hidden rounded-lg bg-[#f0f0f0] p-3 text-left"
    >
      <span className="grid min-w-0 grid-rows-[auto_1fr_auto] self-stretch overflow-hidden">
        <span className="block truncate text-[13px] font-bold leading-tight" title={product.name}>
          {product.name.toUpperCase()}
        </span>
        <span className="line-clamp-3 block max-h-[51px] self-center overflow-hidden text-[12.5px] font-normal leading-[17px]">
          {product.description}
        </span>
        <span className="block text-[13px] font-bold">{formatCurrency(product.price)}</span>
      </span>
      <span className="brand-photo-frame relative block h-[96px] self-center overflow-hidden rounded-lg bg-[#4b160e]">
        <ImageWithFallback
          src={product.image}
          fallbackSrc={fallbackImages[product.category] || categoriaFrutosDoMar}
          alt=""
          className={`block size-full object-cover object-center ${product.id === 'camarao-coco-brasil' ? 'scale-[1.14]' : 'scale-[1.03]'}`}
        />
        <span className="absolute bottom-2 right-2 flex h-5 items-center justify-center gap-px whitespace-nowrap rounded-full bg-white/95 px-1.5 text-[9px] font-semibold leading-none tracking-[0.01em] text-[#4b160e] shadow-[0_2px_8px_rgba(67,22,15,0.16)]">
          Ver prato
          <ArrowRight size={9} strokeWidth={1.7} aria-hidden="true" />
        </span>
      </span>
    </button>
  )
}

function MenuProductGridCard({ product, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={buildProductAriaLabel(product)}
      className="h-[236px] overflow-hidden rounded-lg bg-[#f0f0f0] p-2.5 text-left transition active:scale-[0.99]"
    >
      <span className="brand-photo-frame relative block h-[108px] overflow-hidden rounded-lg bg-[#4b160e]">
        <ImageWithFallback
          src={product.image}
          fallbackSrc={fallbackImages[product.category] || categoriaFrutosDoMar}
          alt=""
          className={`block size-full object-cover object-center ${product.id === 'camarao-coco-brasil' ? 'scale-[1.14]' : 'scale-[1.03]'}`}
        />
        <span className="absolute bottom-2 right-2 flex h-5 items-center justify-center gap-px whitespace-nowrap rounded-full bg-white/95 px-1.5 text-[9px] font-semibold leading-none tracking-[0.01em] text-[#4b160e] shadow-[0_2px_8px_rgba(67,22,15,0.16)]">
          Ver prato
          <ArrowRight size={9} strokeWidth={1.7} aria-hidden="true" />
        </span>
      </span>
      <span className="mt-3 block truncate text-center text-[12.5px] font-bold leading-tight" title={product.name}>
        {product.name.toUpperCase()}
      </span>
      <span className="mt-1 line-clamp-3 block h-12 max-h-12 overflow-hidden text-center text-[11.5px] font-normal leading-4 text-[#5e332a]">
        {product.description}
      </span>
      <span className="mt-1.5 block text-center text-[13px] font-bold">{formatCurrency(product.price)}</span>
    </button>
  )
}

function PromotionScreen({ promo, restaurantProfile = defaultRestaurantProfile, onBack, onOpenProduct }) {
  const includes = promo?.includes ?? ['Oferta especial da casa']
  const conditions = promo?.conditions ?? ['Consulte disponibilidade com o garçom']

  return (
    <section className="h-full overflow-y-auto overflow-x-hidden bg-white pb-8 text-[#4b160e]" aria-labelledby="promotion-title">
      <TopPhotoBar backgroundImage={restaurantProfile.cover} onBack={onBack} onOpenSettings={onBack} compact />

      <div className="-mt-9 rounded-t-[36px] bg-white px-6 pb-8 pt-8 shadow-[0_-14px_34px_rgba(67,22,15,0.10)]">
        <div className="overflow-hidden rounded-xl bg-[#4b160e] p-2 shadow-lg shadow-[#4b160e]/10">
          <ImageWithFallback
            src={promo?.image}
            fallbackSrc={promo?.id === protectedPromoSlideId ? slideVezzBanner : promoShrimp}
            alt={promo?.alt ?? 'Promoção'}
            className="h-[164px] w-full rounded-lg object-contain"
            draggable="false"
          />
        </div>

        <div className="mt-5">
          <p className="text-xs font-black uppercase tracking-wide text-[#d09a45]">Promoção em destaque</p>
          <h1 id="promotion-title" data-screen-title="true" tabIndex={-1} className="mt-1 text-[26px] font-black leading-tight outline-none">
            {(promo?.title ?? 'Promoção especial').toUpperCase()}
          </h1>
          <p className="mt-2 text-[15px] font-semibold leading-6 text-[#6b433a]">{promo?.subtitle}</p>
        </div>

        <section className="mt-5 rounded-xl border border-[#eadfd9] bg-[#fbf7f2] p-4">
          <h2 className="text-sm font-black uppercase">O que inclui</h2>
          <div className="mt-3 space-y-2">
            {includes.map((item) => (
              <p key={item} className="flex gap-2 text-sm font-semibold leading-5 text-[#5f352c]">
                <CircleCheck size={16} className="mt-0.5 shrink-0 text-[#d09a45]" />
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-3 rounded-xl border border-[#eadfd9] bg-white p-4">
          <h2 className="text-sm font-black uppercase">Condições</h2>
          <div className="mt-3 space-y-2">
            {conditions.map((item) => (
              <p key={item} className="text-sm font-semibold leading-5 text-[#6b433a]">
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-3 rounded-xl bg-[#4b160e] p-4 text-white">
          <h2 className="text-sm font-black uppercase text-[#d8ad61]">Como será entregue</h2>
          <p className="mt-2 text-sm font-semibold leading-5 text-white/88">{promo?.delivery}</p>
        </section>

        {promo?.productId && (
          <button
            type="button"
            onClick={() => onOpenProduct(promo.productId)}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[#4b160e] text-sm font-black uppercase tracking-wide text-white transition active:scale-[0.99]"
          >
            Ver prato da promoção
          </button>
        )}
      </div>
    </section>
  )
}

function ProductImageGallery({ product }) {
  return (
    <div className="brand-photo-frame mx-1 aspect-[1.48] overflow-hidden rounded-lg bg-[#4b160e] p-2" aria-label="Foto do prato">
      <ImageWithFallback
        src={product.image}
        fallbackSrc={fallbackImages[product.category] || categoriaFrutosDoMar}
        alt={product.name}
        className="size-full rounded-md object-cover"
        draggable="false"
      />
    </div>
  )
}

function DishInfoChips({ product }) {
  const infoTags = buildDishInfoTags(product)

  if (!infoTags.length) return null

  return (
    <section className="mt-1.5" aria-label="Informações importantes do prato">
      <div className="flex flex-wrap justify-center gap-1.5">
        {infoTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex h-8 min-w-0 items-center gap-1 rounded-full bg-[#edf0f2] px-1.5 text-[9px] font-medium text-[#8c6056]"
          >
            <span className="size-6 shrink-0">{getAllergenIcon(tag)}</span>
            {tag}
          </span>
        ))}
      </div>
    </section>
  )
}

function ProductScreen({ product, restaurantProfile = defaultRestaurantProfile, editingCartItem = null, onBack, onAddToCart, onAdded, onSaveCartItem, onOpenSettings }) {
  const productOptions = useMemo(
    () =>
      product.options?.length
        ? product.options
        : [{ id: 'base', label: '1 pessoa', detail: 'Porção individual', price: product.price, people: 1 }],
    [product],
  )
  const [selectedOptionId, setSelectedOptionId] = useState(() => editingCartItem?.optionId || '')
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState(() => editingCartItem?.note ?? '')
  const [itemAdded, setItemAdded] = useState(false)
  const selectedOption = productOptions.find((option) => option.id === selectedOptionId) ?? null
  const itemTotal = (selectedOption?.price ?? product.price) * quantity

  function addCurrentItem() {
    if (!selectedOption) return

    if (editingCartItem) {
      onSaveCartItem(selectedOption, note.trim())
      return
    }

    onAddToCart(product.id, quantity, note.trim(), selectedOption)
    setItemAdded(true)
    window.setTimeout(() => onAdded(), 1300)
  }

  return (
    <section className="relative h-full overflow-y-auto overflow-x-hidden bg-white pb-8 text-[#4b160e]" aria-labelledby="product-title">
      <TopPhotoBar
        backgroundImage={restaurantProfile.cover}
        onBack={onBack}
        onOpenSettings={onOpenSettings}
        compact
      />

      <div className="relative z-10 -mt-[38px] min-h-[calc(100%-106px)] rounded-t-[18px] bg-white px-7 pb-32 pt-6 shadow-[0_-14px_34px_rgba(67,22,15,0.10)]">
        <div>
          <ProductImageGallery product={product} />
        </div>

        <DishInfoChips product={product} />

        <div className="mt-4 text-center">
          <h1
            id="product-title"
            data-screen-title="true"
            tabIndex={-1}
            className="font-montserrat text-[21px] font-normal leading-tight tracking-[-0.01em] outline-none"
          >
            {product.name.toUpperCase()}
          </h1>
          <p className="mx-auto mt-1.5 max-w-[360px] text-[15px] font-normal leading-[21px] text-[#5f3730]">
            {product.description}
          </p>
        </div>

        <section className="mt-6">
          <h2 className="font-montserrat mb-2 text-[14px] font-normal text-[#6b3025]">Opções de porções e preços</h2>
          <div className="space-y-2.5">
          {productOptions.map((option) => {
            const active = selectedOption?.id === option.id

            return (
              <button
                type="button"
                key={option.id}
                onClick={() => setSelectedOptionId(option.id)}
                aria-pressed={active}
                className={`grid min-h-[62px] w-full grid-cols-[42px_1fr_auto_18px] items-center gap-2.5 rounded-lg border px-3.5 text-left transition active:scale-[0.99] ${
                  active
                    ? 'border-[#4b160e] bg-[#f2e3cc] text-[#4b160e]'
                    : 'border-[#bfa8a0] bg-white'
                }`}
              >
                <span className="flex max-w-[42px] flex-wrap justify-center gap-0.5 text-[#8b6d63]" aria-hidden="true">
                  {Array.from({ length: Math.min(Number(option.people) || 1, 4) }, (_, personIndex) => (
                    <UserRound key={personIndex} size={17} strokeWidth={1.5} />
                  ))}
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-medium">{option.label}</span>
                  <span className="block text-[12px] font-medium text-[#a58f89]">{option.detail}</span>
                </span>
                <span className="text-[15px] font-black">{formatCurrency(option.price)}</span>
                <span className={`size-[18px] rounded-full border ${active ? 'border-[#4b160e] bg-[#4b160e]' : 'border-[#9f8881] bg-white'}`} />
              </button>
            )
          })}
          </div>
        </section>

        <label className="mt-5 block">
          <span className="font-montserrat text-[14px] font-normal text-[#6b3025]">Observações</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ex.: sem cebola, molho à parte ou algum pedido especial"
            className="mt-2 h-[72px] w-full resize-none rounded-lg border border-[#d8c7bf] bg-white px-3.5 py-3 text-[13px] font-normal leading-[18px] text-[#4b160e] outline-none placeholder:text-[#b6a4a0] focus:border-[#8d5a4e]"
          />
        </label>

        <button
          type="button"
          onClick={addCurrentItem}
          disabled={!selectedOption}
          className="fixed bottom-[calc(14px+env(safe-area-inset-bottom))] left-1/2 z-[80] flex h-12 w-[74vw] max-w-[370px] -translate-x-1/2 items-center justify-center rounded-full bg-[#4b160e] text-[16px] font-medium text-white shadow-[0_8px_24px_rgba(75,22,14,0.22)] transition active:scale-[0.99] disabled:bg-[#c5b5af] disabled:text-white/80 disabled:shadow-none"
        >
          {!selectedOption ? (
            'SELECIONE UMA PORÇÃO'
          ) : editingCartItem ? (
            'SALVAR ALTERAÇÕES'
          ) : (
            <>ADICIONAR - <strong className="ml-1">{formatCurrency(itemTotal)}</strong></>
          )}
        </button>
      </div>

      {itemAdded && (
        <div className="fixed inset-0 z-[220] grid place-items-center bg-black/20 px-7 md:absolute" role="status" aria-live="polite">
          <div className="w-full max-w-[280px] rounded-[16px] border border-[#d8c7bf] bg-white px-4 py-4 text-center shadow-2xl shadow-[#4b160e]/20">
            <span className="mx-auto grid size-10 place-items-center rounded-full bg-[#f2e3cc] text-[#4b160e]">
              <ShoppingCart size={19} />
            </span>
            <p className="mt-2.5 text-[13px] font-medium leading-[18px] text-[#4b160e]">
              O prato <strong>{product.name}</strong> foi adicionado ao seu carrinho.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

function AdminLoginScreen({ error, loading, recoveryLoading = false, onBack, onLogin, onRecoverPassword }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function submitLogin(event) {
    event.preventDefault()

    if (!email.trim() || !password) {
      return
    }

    onLogin({ email, password })
  }

  return (
    <section className="h-full overflow-hidden bg-white text-[#4b160e]" aria-labelledby="admin-login-title">
      <div className="relative h-[144px] overflow-hidden">
        <img src={cocoBackground} alt="" className="h-full w-full object-cover" draggable="false" />
        <div className="absolute inset-0 bg-black/10" />
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar ao cardapio"
          className="absolute left-7 top-5 grid size-9 place-items-center rounded-full bg-white/85 text-[#4b160e] shadow-lg shadow-black/15 ring-1 ring-white/70 transition active:scale-95"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
      </div>

      <div className="relative z-10 -mt-8 min-h-[calc(100%-112px)] rounded-t-[34px] bg-white px-8 pb-10 pt-[78px] shadow-[0_-14px_34px_rgba(67,22,15,0.10)]">
        <img
          src={cocoLogo}
          alt="Coco Bambu"
          loading="eager"
          decoding="sync"
          className="absolute left-1/2 top-[-70px] size-[96px] -translate-x-1/2 rounded-full bg-[#4b160e]"
          draggable="false"
        />

        <div className="mx-auto mt-20 w-full max-w-[320px] text-center">
          <h1
            id="admin-login-title"
            data-screen-title="true"
            tabIndex={-1}
            className="text-[31px] font-bold leading-none outline-none"
          >
            LOGIN
          </h1>
          <p className="mt-2.5 text-[13px] font-normal uppercase leading-none">ACESSO ADMINISTRATIVO</p>

          <form onSubmit={submitLogin} className="mt-7 space-y-2.5 text-left">
          <label className="grid h-[52px] grid-cols-[24px_1fr] items-center gap-3 rounded-lg bg-[#eeeeee] px-4 text-[#a9908b]">
            <Mail size={20} strokeWidth={1.8} />
            <span className="sr-only">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="h-full bg-transparent text-[15px] font-normal text-[#4b160e] outline-none placeholder:text-[#ad9995]"
            />
          </label>

          <label className="grid h-[52px] grid-cols-[24px_1fr] items-center gap-3 rounded-lg bg-[#eeeeee] px-4 text-[#a9908b]">
            <LockKeyhole size={20} strokeWidth={1.8} />
            <span className="sr-only">Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Senha"
              autoComplete="current-password"
              className="h-full bg-transparent text-[15px] font-normal text-[#4b160e] outline-none placeholder:text-[#ad9995]"
            />
          </label>

          <button
            type="button"
            onClick={() => onRecoverPassword(email)}
            disabled={recoveryLoading}
            className="mx-auto block text-[11px] font-normal text-[#7b5148] underline-offset-4 transition hover:underline disabled:opacity-60"
          >
            {recoveryLoading ? 'Enviando recuperacao...' : 'Esqueci minha senha'}
          </button>

          {error && (
            <p className="pt-1 text-center text-xs font-bold text-red-700" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mx-auto !mt-6 flex h-[46px] w-[230px] max-w-full items-center justify-center rounded-lg bg-[#4b160e] text-[15px] font-bold text-white transition active:scale-[0.99] disabled:bg-[#8f6b62]"
          >
            {loading ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
          </form>
        </div>
      </div>
    </section>
  )
}

function AdminRegisterScreen({ defaultEmail = '', error, loading, onBack, onRegister }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState('')

  function submitRegister(event) {
    event.preventDefault()

    if (!username.trim() || !email.trim() || !password) {
      return
    }

    onRegister({ username, email, password })
  }

  return (
    <section className="h-full overflow-hidden bg-white text-[#4b160e]" aria-labelledby="admin-register-title">
      <div className="relative h-[144px] overflow-hidden">
        <img src={cocoBackground} alt="" className="h-full w-full object-cover" draggable="false" />
        <div className="absolute inset-0 bg-black/10" />
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar ao login administrativo"
          className="absolute left-7 top-8 grid size-11 place-items-center rounded-full bg-white/85 text-[#4b160e] shadow-lg shadow-black/15 ring-1 ring-white/70 transition active:scale-95"
        >
          <ArrowLeft size={25} strokeWidth={2.8} />
        </button>
      </div>

      <div className="relative z-10 -mt-8 min-h-[calc(100%-112px)] rounded-t-[34px] bg-white px-11 pt-[84px] shadow-[0_-14px_34px_rgba(67,22,15,0.10)]">
        <img
          src={cocoLogo}
          alt="Coco Bambu"
          loading="eager"
          decoding="sync"
          className="absolute left-1/2 top-[-70px] size-[96px] -translate-x-1/2 rounded-full bg-[#4b160e]"
          draggable="false"
        />

        <div className="text-center">
          <h1
            id="admin-register-title"
            data-screen-title="true"
            tabIndex={-1}
            className="text-[32px] font-black leading-none outline-none"
          >
            CADASTRO
          </h1>
          <p className="mt-4 text-base font-normal uppercase leading-none">ADMINISTRADOR</p>
        </div>

        <form onSubmit={submitRegister} className="mt-8 space-y-3">
          <label className="grid h-[58px] grid-cols-[28px_1fr] items-center gap-3 rounded-[9px] bg-[#eeeeee] px-5 text-[#a9908b]">
            <UserRound size={22} strokeWidth={2} />
            <span className="sr-only">Usuario</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Usuario"
              autoComplete="name"
              className="h-full bg-transparent text-base font-normal text-[#4b160e] outline-none placeholder:text-[#ad9995]"
            />
          </label>

          <label className="grid h-[58px] grid-cols-[28px_1fr] items-center gap-3 rounded-[9px] bg-[#eeeeee] px-5 text-[#a9908b]">
            <Mail size={22} strokeWidth={2} />
            <span className="sr-only">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="h-full bg-transparent text-base font-normal text-[#4b160e] outline-none placeholder:text-[#ad9995]"
            />
          </label>

          <label className="grid h-[58px] grid-cols-[28px_1fr] items-center gap-3 rounded-[9px] bg-[#eeeeee] px-5 text-[#a9908b]">
            <LockKeyhole size={22} strokeWidth={2} />
            <span className="sr-only">Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Senha"
              autoComplete="new-password"
              className="h-full bg-transparent text-base font-normal text-[#4b160e] outline-none placeholder:text-[#ad9995]"
            />
          </label>

          {error && (
            <p className="pt-1 text-center text-xs font-bold text-red-700" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mx-auto !mt-8 flex h-12 w-[247px] max-w-full items-center justify-center rounded-[9px] bg-[#4b160e] text-base font-black text-white transition active:scale-[0.99] disabled:bg-[#8f6b62]"
          >
            {loading ? 'CADASTRANDO...' : 'CADASTRAR'}
          </button>
        </form>
      </div>
    </section>
  )
}

function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null

  const toneClasses = {
    success: 'border-emerald-200 bg-white text-[#244537]',
    error: 'border-red-200 bg-white text-[#5f1a14]',
    warning: 'border-amber-200 bg-white text-[#5b3b12]',
  }

  const iconClasses = {
    success: 'bg-emerald-50 text-emerald-700',
    error: 'bg-red-50 text-red-700',
    warning: 'bg-amber-50 text-amber-700',
  }

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[140] grid w-[calc(100vw-32px)] max-w-[398px] -translate-x-1/2 gap-2">
      {toasts.map((toast) => (
        <article
          key={toast.id}
          role="status"
          className={`pointer-events-auto grid grid-cols-[34px_1fr_auto] items-start gap-3 rounded-xl border px-3 py-3 shadow-2xl shadow-black/15 transition duration-700 ease-out ${
            toneClasses[toast.tone] ?? toneClasses.success
          }`}
        >
          <span
            className={`mt-0.5 grid size-8 place-items-center rounded-full ${
              iconClasses[toast.tone] ?? iconClasses.success
            }`}
          >
            {toast.tone === 'error' ? <X size={16} strokeWidth={2.8} /> : <CircleCheck size={16} strokeWidth={2.8} />}
          </span>
          <span className="min-w-0">
            <strong className="block text-sm font-black leading-tight">{toast.title}</strong>
            {toast.message && (
              <span className="mt-1 block text-xs font-medium leading-4 opacity-80">{toast.message}</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Fechar notificacao"
            className="grid size-7 place-items-center rounded-full text-current opacity-50 transition hover:bg-black/5 hover:opacity-90"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </article>
      ))}
    </div>
  )
}

function SettingsScreen({
  analyticsSummary,
  adminEmail,
  categories,
  copied,
  generatedNfcLink,
  nfcTable,
  products,
  onBack,
  onCopyNfcLink,
  onNfcTableChange,
  onOpenNfcPreview,
  onOpenPartnerLink,
  onLogout,
  onOpenMenuEditor,
  onChangeCredentials,
  onCreateRestaurant,
}) {
  const [activeTab, setActiveTab] = useState(() => getInitialAdminTab())


  const settingsTabs = [
    { id: 'cardapio', label: 'Cardápio', icon: BadgePlus },
    { id: 'mesas', label: 'Mesas', icon: Nfc },
    { id: 'vezz', label: 'Vezz', icon: BarChart3 },
    { id: 'cartao', label: 'Cartão', icon: CreditCard },
    { id: 'conta', label: 'Conta', icon: UserRound },
  ]

  return (
    <section className="relative h-full overflow-y-auto overflow-x-hidden bg-white pb-8">
      <HeaderBar title="Admin" onBack={onBack} />

      <div className="ml-5 w-[390px] max-w-[calc(100vw-40px)] pt-5">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase text-slate-400">Configurações</p>
            <h2 className="mt-1 text-2xl font-black leading-tight text-slate-950">
              Gerenciar cardápio
            </h2>
            <p className="mt-1 truncate text-xs font-bold text-slate-400">{adminEmail}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-1 grid size-10 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-600 ring-1 ring-slate-200 transition active:scale-95"
            aria-label="Sair do admin"
            title="Sair"
          >
            <LogOut size={17} strokeWidth={2.4} />
          </button>
        </div>

        <div
          role="tablist"
          aria-label="Áreas de administração"
          className="mt-4 grid grid-cols-5 gap-1 border-b border-slate-200"
        >
          {settingsTabs.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={`flex h-11 items-center justify-center gap-1.5 border-b-2 text-[11px] font-black transition ${
                activeTab === id
                  ? 'border-slate-950 text-slate-950'
                  : 'border-transparent text-slate-500'
              }`}
            >
              <Icon size={15} strokeWidth={2.4} />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'cardapio' && (
          <AdminMenuStart
            activeProducts={products.filter((product) => product.active !== false).length}
            categoriesCount={categories.length}
            productsCount={products.length}
            onOpenEditor={onOpenMenuEditor}
            onStartNewProduct={onOpenMenuEditor}
          />
        )}


        {activeTab === 'mesas' && (
          <section className="mt-5 space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-950">Mesa por NFC/QR</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Link pronto para etiqueta ou QR.
                  </p>
                </div>
                <Nfc size={19} className="text-slate-400" />
              </div>

              <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                <AdminInput
                  label="Mesa"
                  value={nfcTable}
                  placeholder="01"
                  onChange={onNfcTableChange}
                />
                <button
                  type="button"
                  onClick={onOpenNfcPreview}
                  className="mt-[22px] grid size-11 place-items-center rounded-lg bg-slate-950 text-white"
                  aria-label="Abrir link da mesa"
                >
                  <QrCode size={19} />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {tableOptions.map((table) => (
                  <button
                    type="button"
                    key={table}
                    onClick={() => onNfcTableChange(table)}
                    aria-pressed={nfcTable === table}
                    className={`h-10 rounded-md text-sm font-black transition active:scale-[0.98] ${
                      nfcTable === table
                        ? 'bg-[#ffda16] text-slate-950'
                        : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200'
                    }`}
                  >
                    {table}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-slate-400">Link gerado</p>
              <p className="mt-2 line-clamp-2 break-all text-[11px] font-bold leading-5 text-slate-700">
                {generatedNfcLink}
              </p>

              <button
                type="button"
                onClick={onCopyNfcLink}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-black text-slate-950 ring-1 ring-slate-200 transition active:scale-[0.99]"
              >
                {copied ? <CircleCheck size={17} /> : <Clipboard size={17} />}
                {copied ? 'LINK COPIADO' : 'COPIAR LINK'}
              </button>
            </div>
          </section>
        )}

        {activeTab === 'vezz' && (
          <section className="mt-5 space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-white/45">Parceria Vezz</p>
                  <h2 className="mt-1 text-xl font-black">Impacto no restaurante</h2>
                </div>
                <CarFront size={22} className="text-[#ffda16]" />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <PartnerMetric label="Acessos" value={analyticsSummary.menuOpens} />
                <PartnerMetric label="Cliques" value={analyticsSummary.vezzClicks} />
                <PartnerMetric label="CTR" value={`${analyticsSummary.vezzCtr}%`} />
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <PartnerMetric label="Pedidos" value={analyticsSummary.ordersSent} />
                <PartnerMetric label="Ticket médio" value={formatCurrency(analyticsSummary.averageTicket)} />
              </div>

              <button
                type="button"
                onClick={() => onOpenPartnerLink('vezz', partnerLinks.vezz)}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#ffda16] text-sm font-black text-slate-950"
              >
                <ExternalLink size={16} />
                ABRIR VEZZ
              </button>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-base font-black text-slate-950">Interesse por horário</h2>
              <div className="mt-4 space-y-3">
                {analyticsSummary.hourlyDemand.map(({ hour, count, width }) => (
                  <div key={hour} className="grid grid-cols-[34px_1fr_28px] items-center gap-2">
                    <span className="text-xs font-black text-slate-500">{hour}h</span>
                    <span className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full bg-slate-950"
                        style={{ width: `${width}%` }}
                      />
                    </span>
                    <span className="text-right text-xs font-black text-slate-500">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'cartao' && (
          <section className="mt-5 space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-950">Cartão físico</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Hub NFC, QR, WhatsApp e acessibilidade.
                  </p>
                </div>
                <CreditCard size={19} className="text-slate-400" />
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-[11px] font-black uppercase text-slate-400">
                  {restaurantName}
                </p>
                <h3 className="mt-2 text-lg font-black text-slate-950">APROXIME SEU CELULAR</h3>
                <div className="mx-auto mt-4 grid size-20 place-items-center rounded-lg bg-white text-slate-950 ring-1 ring-slate-200">
                  <Nfc size={34} />
                </div>
                <p className="mt-4 text-xs font-bold text-slate-500">ou escaneie o QR</p>
                <div className="mx-auto mt-3 grid size-24 place-items-center rounded-lg bg-white ring-1 ring-slate-200">
                  <QrCode size={54} />
                </div>
                <div className="mt-4 space-y-1 text-xs font-black text-slate-700">
                  <p>@nomedorestaurante</p>
                  <p>WhatsApp: (81) 99999-9999</p>
                  <p className="pt-2 text-sm tracking-[0.18em] text-slate-950">????????</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <SettingsRow label="Destino curto" value={cardBaseUrl.replace('https://', '')} />
              <SettingsRow label="Origem" value={`Mesa ${nfcTable || '01'}`} />
              <SettingsRow label="Wi-Fi" value="Adicionar no verso" />
            </div>
          </section>
        )}

        {activeTab === 'conta' && (
          <AdminAccountPanel
            currentEmail={adminEmail}
            onChangeCredentials={onChangeCredentials}
            onCreateRestaurant={onCreateRestaurant}
          />
        )}
      </div>
    </section>
  )
}

function AdminAccountPanel({ currentEmail, onChangeCredentials, onCreateRestaurant }) {
  const [accessForm, setAccessForm] = useState({ currentPassword: '', email: currentEmail, password: '' })
  const [restaurantForm, setRestaurantForm] = useState({ name: '', adminName: '', email: '', password: '' })
  const [savingAccess, setSavingAccess] = useState(false)
  const [creatingRestaurant, setCreatingRestaurant] = useState(false)
  const [createdRestaurant, setCreatedRestaurant] = useState(null)

  async function submitAccess(event) {
    event.preventDefault()
    setSavingAccess(true)
    const saved = await onChangeCredentials(accessForm)
    if (saved) setAccessForm((current) => ({ ...current, currentPassword: '', password: '' }))
    setSavingAccess(false)
  }

  async function submitRestaurant(event) {
    event.preventDefault()
    setCreatingRestaurant(true)
    const created = await onCreateRestaurant(restaurantForm)
    setCreatedRestaurant(created)
    if (created) setRestaurantForm({ name: '', adminName: '', email: '', password: '' })
    setCreatingRestaurant(false)
  }

  const fieldClass = 'mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-500'

  return (
    <section className="mt-5 space-y-4">
      <form onSubmit={submitAccess} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-black text-slate-950">Alterar meu login</h2>
        <p className="mt-1 text-xs text-slate-500">Confirme a senha atual antes de trocar o email ou a senha.</p>
        <label className="mt-4 block text-xs font-bold text-slate-600">Senha atual
          <input required type="password" value={accessForm.currentPassword} onChange={(event) => setAccessForm({ ...accessForm, currentPassword: event.target.value })} className={fieldClass} autoComplete="current-password" />
        </label>
        <label className="mt-3 block text-xs font-bold text-slate-600">Novo email
          <input required type="email" value={accessForm.email} onChange={(event) => setAccessForm({ ...accessForm, email: event.target.value })} className={fieldClass} autoComplete="email" />
        </label>
        <label className="mt-3 block text-xs font-bold text-slate-600">Nova senha
          <input type="password" minLength={6} value={accessForm.password} onChange={(event) => setAccessForm({ ...accessForm, password: event.target.value })} className={fieldClass} placeholder="Deixe vazio para manter a atual" autoComplete="new-password" />
        </label>
        <button disabled={savingAccess} className="mt-4 h-10 w-full rounded-full bg-[var(--brand-primary)] text-sm font-bold text-white disabled:opacity-50">
          {savingAccess ? 'Salvando...' : 'Atualizar acesso'}
        </button>
      </form>

      <form onSubmit={submitRestaurant} className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-black text-slate-950">Adicionar restaurante</h2>
        <p className="mt-1 text-xs leading-4 text-slate-500">Cria uma cópia independente deste cardápio. Depois, o novo administrador poderá trocar fotos, pratos, logo e cores sem alterar o Coco Bambu.</p>
        <label className="mt-4 block text-xs font-bold text-slate-600">Nome do restaurante
          <input required value={restaurantForm.name} onChange={(event) => setRestaurantForm({ ...restaurantForm, name: event.target.value })} className={fieldClass} />
        </label>
        <label className="mt-3 block text-xs font-bold text-slate-600">Nome do administrador
          <input required value={restaurantForm.adminName} onChange={(event) => setRestaurantForm({ ...restaurantForm, adminName: event.target.value })} className={fieldClass} />
        </label>
        <label className="mt-3 block text-xs font-bold text-slate-600">Email do novo administrador
          <input required type="email" value={restaurantForm.email} onChange={(event) => setRestaurantForm({ ...restaurantForm, email: event.target.value })} className={fieldClass} />
        </label>
        <label className="mt-3 block text-xs font-bold text-slate-600">Senha inicial
          <input required type="password" minLength={6} value={restaurantForm.password} onChange={(event) => setRestaurantForm({ ...restaurantForm, password: event.target.value })} className={fieldClass} />
        </label>
        <button disabled={creatingRestaurant} className="mt-4 h-10 w-full rounded-full bg-[var(--brand-primary)] text-sm font-bold text-white disabled:opacity-50">
          {creatingRestaurant ? 'Criando...' : 'Criar restaurante'}
        </button>
        {createdRestaurant && (
          <a href={createdRestaurant.publicUrl} className="mt-3 block break-all rounded-lg bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
            Abrir novo cardápio: {createdRestaurant.publicUrl}
          </a>
        )}
      </form>
    </section>
  )
}

function AdminMenuStart({ activeProducts, categoriesCount, productsCount, onOpenEditor, onStartNewProduct }) {
  return (
    <section className="mt-5 space-y-4">
      <button
        type="button"
        onClick={onOpenEditor}
        className="grid w-full grid-cols-[44px_1fr_auto] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm shadow-slate-200/70 transition active:scale-[0.99]"
      >
        <span className="grid size-11 place-items-center rounded-lg bg-[#4b160e] text-[#d8ad61]">
          <BadgePlus size={21} strokeWidth={2.5} />
        </span>
        <span className="min-w-0">
          <span className="block text-base font-black text-slate-950">Editar cardapio</span>
          <span className="mt-1 block text-xs font-semibold text-slate-500">
            Promocoes, categorias e pratos em uma visao unica.
          </span>
        </span>
        <ChevronRight size={20} className="text-slate-400" />
      </button>

      <div className="grid grid-cols-3 gap-2">
        <AdminStat label="Itens" value={productsCount} />
        <AdminStat label="Ativos" value={activeProducts} />
        <AdminStat label="Categorias" value={categoriesCount} />
      </div>

      <button
        type="button"
        onClick={onStartNewProduct}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 text-sm font-black text-white transition active:scale-[0.99]"
      >
        <Plus size={17} strokeWidth={2.8} />
        ADICIONAR ITEM
      </button>
    </section>
  )
}

function AdminStat({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-lg font-black text-slate-950">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">{label}</p>
    </div>
  )
}

function buildAdminProductDraft(product, fallbackCategory = 'frutos-do-mar') {
  const category = product?.category ?? fallbackCategory
  const options = product?.options?.length
    ? product.options
    : [
        {
          id: 'base',
          label: '1 pessoa',
          detail: 'Porção individual',
          price: product?.price ?? '',
          people: 1,
        },
      ]

  return {
    name: product?.name ?? '',
    category,
    description: product?.description ?? '',
    image: product?.image ?? fallbackImages[category],
    tags: (product?.tags ?? []).filter((tag) =>
      allergenOptions.some((allergen) => normalizeText(allergen.id) === normalizeText(tag)),
    ),
    options: options.map((option) => ({
      id: option.id,
      label: option.label,
      detail: option.detail,
      people: String(option.people ?? option.label?.match(/\d+/)?.[0] ?? ''),
      price: formatAdminPriceInput(option.price),
    })),
  }
}

function buildAdminProductPayload(draft, currentProduct) {
  const options = draft.options.map((option) => {
    const people = Number(option.people) || null

    return {
      id: option.id,
      label: option.label || `${option.people} ${people === 1 ? 'pessoa' : 'pessoas'}`,
      detail: option.detail,
      price: parseAdminPrice(option.price),
      people,
    }
  })
  const price = options[0]?.price || currentProduct?.price || 0

  return {
    ...(currentProduct ?? {}),
    id: currentProduct?.id ?? `admin-${Date.now()}`,
    category: draft.category,
    name: draft.name.trim(),
    price,
    image: draft.image || fallbackImages[draft.category],
    badge: currentProduct?.badge ?? 'Admin',
    badgeTone: currentProduct?.badgeTone ?? 'border-slate-200 bg-white text-slate-600',
    badgeIcon: currentProduct?.badgeIcon ?? Save,
    badgeIconTone: currentProduct?.badgeIconTone ?? 'text-slate-600',
    description: draft.description.trim() || 'Item cadastrado pelo administrador do cardápio.',
    tags: draft.tags,
    options,
    active: currentProduct?.active !== false,
  }
}

function parseAdminPrice(value) {
  const normalizedValue = String(value ?? '')
    .replace(/[R$\s.]/g, '')
    .replace(',', '.')

  return Number(normalizedValue) || 0
}

function formatAdminPriceInput(value) {
  if (value === '' || value === null || value === undefined) return ''

  return String(value).replace('.', ',')
}

function getAllergenIcon(label) {
  const normalizedLabel = normalizeText(label)
  const allergenImages = {
    castanhas: allergenCastanhas,
    ovo: allergenOvo,
    gluten: allergenGluten,
    peixe: allergenPeixe,
    lactose: allergenLactose,
    crustaceos: allergenCrustaceos,
    soja: allergenSoja,
  }

  const imageKey = Object.keys(allergenImages).find((key) => normalizedLabel.includes(key))

  if (imageKey) {
    return <img src={allergenImages[imageKey]} alt="" className="block size-full object-contain mix-blend-multiply" draggable="false" />
  }
  return '+'
}

function AdminMenuEditor({
  categories,
  products,
  promoItems = promoSlides,
  restaurantProfile = defaultRestaurantProfile,
  onUpdateProfile,
  onAddAdminItem,
  onBack,
  onDone,
  onRemoveProduct,
  onToggleProductActive,
  onUpdateCategories,
  onUpdatePromos,
  onUpdateProduct,
}) {
  const [editorView, setEditorView] = useState('home')
  const [editorProfile, setEditorProfile] = useState(restaurantProfile)
  const [editorPromos, setEditorPromos] = useState(promoItems)
  const [editorCategories, setEditorCategories] = useState(categories)
  const [editingPromoId, setEditingPromoId] = useState('')
  const [editingProductId, setEditingProductId] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState('')
  const [productReturnView, setProductReturnView] = useState('home')
  const [profileEditorOpen, setProfileEditorOpen] = useState(false)
  const [coverEditorOpen, setCoverEditorOpen] = useState(false)
  const [logoEditorOpen, setLogoEditorOpen] = useState(false)
  const [editorActionsOpen, setEditorActionsOpen] = useState(false)
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    setEditorProfile(restaurantProfile)
  }, [restaurantProfile])

  useEffect(() => {
    setEditorPromos(promoItems)
  }, [promoItems])

  useEffect(() => {
    setEditorCategories(categories)
  }, [categories])

  function editProduct(product, returnView = 'home') {
    setEditingProductId(product.id)
    setEditingCategoryId(product.category)
    setProductReturnView(returnView)
    setEditorView('product')
  }

  function editPromo(slide) {
    if (slide.id === protectedPromoSlideId) return

    setEditingPromoId(slide.id)
    setEditorView('promo')
  }

  function addPromo() {
    const nextPromo = {
      id: `admin-promo-${Date.now()}`,
      image: promoShrimp,
      alt: 'Novo card promocional',
      targetType: 'promotion',
      fit: 'contain',
    }

    setEditorPromos((items) => [...items, nextPromo])
    setEditingPromoId(nextPromo.id)
    setEditorView('promo')
  }

  function savePromo(updatedPromo) {
    if (updatedPromo.id === protectedPromoSlideId) return

    const nextPromos = editorPromos.map((item) => (item.id === updatedPromo.id ? { ...item, ...updatedPromo } : item))

    setEditorPromos(nextPromos)
    onUpdatePromos?.(nextPromos)
    setEditingPromoId('')
    onDone(editorProfile)
  }

  function requestRemovePromo(slide) {
    if (slide.id === protectedPromoSlideId) return

    setPendingDelete({
      title: 'Voce tem certeza que deseja excluir?',
      onConfirm: () => {
        const nextPromos = editorPromos.filter((item) => item.id !== slide.id)
        setEditorPromos(nextPromos)
        onUpdatePromos?.(nextPromos)
        setPendingDelete(null)
      },
    })
  }

  function startNewProduct(returnView = 'home', categoryId = editingCategoryId) {
    setEditingProductId('')
    setEditingCategoryId(categoryId)
    setProductReturnView(returnView)
    setEditorView('product')
  }

  function closeProductEditor() {
    setEditingProductId('')
    setEditorView(productReturnView)
  }

  function saveProduct(productPayload) {
    if (editingProductId) {
      onUpdateProduct(productPayload)
    } else {
      onAddAdminItem(productPayload)
    }

    onDone(editorProfile)
  }

  function saveEditorProfile() {
    onUpdatePromos?.(editorPromos)
    onDone(editorProfile)
  }

  function openExitConfirmation() {
    setEditorActionsOpen(false)
    setExitConfirmOpen(true)
  }

  function requestRemoveProduct(product) {
    setPendingDelete({
      title: 'Voce tem certeza que deseja excluir?',
      onConfirm: () => {
        onRemoveProduct(product.id)
        setPendingDelete(null)
      },
    })
  }

  function openCategoryProducts(categoryId) {
    setEditingCategoryId(categoryId)
    setEditorView('category-products')
  }

  function editCategory(category) {
    setEditingCategoryId(category.id)
    setEditorView('category-edit')
  }

  function saveCategory(updatedCategory) {
    const nextCategories = editorCategories.map((category) =>
      category.id === updatedCategory.id ? { ...category, ...updatedCategory } : category,
    )

    setEditorCategories(nextCategories)
    onUpdateCategories?.(nextCategories)
    setEditorView('categories')
  }

  function openCategoriesEditor() {
    setEditingCategoryId('')
    setEditorView('categories')
  }

  function addCategory() {
    const nextCategory = {
      id: `admin-category-${Date.now()}`,
      label: 'Nova Categoria',
      shortLabel: 'Nova',
      iconImage: iconEntradas,
      image: categoriaEntradas,
    }

    const nextCategories = [...editorCategories, nextCategory]
    setEditorCategories(nextCategories)
    onUpdateCategories?.(nextCategories)
    setEditingCategoryId(nextCategory.id)
    setEditorView('category-edit')
  }

  function requestRemoveCategory(category) {
    setPendingDelete({
      title: 'Voce tem certeza que deseja excluir?',
      onConfirm: () => {
        const nextCategories = editorCategories.filter((item) => item.id !== category.id)
        setEditorCategories(nextCategories)
        onUpdateCategories?.(nextCategories)
        setPendingDelete(null)
      },
    })
  }

  const editingProduct = products.find((product) => product.id === editingProductId) ?? null
  const editingPromo = editorPromos.find((slide) => slide.id === editingPromoId) ?? editorPromos[0]
  const editingCategory =
    editorCategories.find((category) => category.id === editingCategoryId) ?? editorCategories[0] ?? categories[0]
  const adminFeaturedProducts = products.slice(0, 5)
  const adminDailyProducts = products
    .filter((product) => !adminFeaturedProducts.some((featuredProduct) => featuredProduct.id === product.id))
    .slice(0, 4)
  const deleteDialog = pendingDelete && (
    <AdminConfirmDialog
      title={pendingDelete.title}
      confirmLabel="Excluir"
      onCancel={() => setPendingDelete(null)}
      onConfirm={pendingDelete.onConfirm}
    />
  )

  if (editorView === 'product') {
    return (
      <div className="relative h-full">
        <AdminProductEditScreen
          categories={editorCategories}
          fallbackCategory={editingCategory.id}
          product={editingProduct}
          restaurantProfile={editorProfile}
          onBack={closeProductEditor}
          onSave={saveProduct}
        />
      </div>
    )
  }

  if (editorView === 'promo') {
    return (
      <div className="relative h-full">
        <AdminPromoEditScreen
          promo={editingPromo}
          products={products}
          restaurantProfile={editorProfile}
          onBack={() => setEditorView('home')}
          onSave={savePromo}
        />
      </div>
    )
  }

  if (editorView === 'category-edit') {
    return (
      <AdminCategoryEditScreen
        category={editingCategory}
        restaurantProfile={editorProfile}
        onBack={() => setEditorView('categories')}
        onSave={saveCategory}
      />
    )
  }

  if (editorView === 'categories') {
    return (
      <div className="relative h-full">
        <AdminCategoriesEditorScreen
          categories={editorCategories}
          restaurantProfile={editorProfile}
          onAddCategory={addCategory}
          onBack={() => setEditorView('home')}
          onEditCategory={editCategory}
          onRemoveCategory={requestRemoveCategory}
        />
        {deleteDialog}
      </div>
    )
  }

  if (editorView === 'category-products') {
    return (
      <div className="relative h-full">
        <AdminCategoryProductsEditorScreen
          category={editingCategory}
          products={products.filter((product) => product.category === editingCategory.id)}
          restaurantProfile={editorProfile}
          onAddProduct={() => startNewProduct('category-products', editingCategory.id)}
          onBack={openCategoriesEditor}
          onEditProduct={(product) => editProduct(product, 'category-products')}
          onRemoveProduct={requestRemoveProduct}
        />
        {deleteDialog}
      </div>
    )
  }

  return (
    <section
      className="relative h-full overflow-y-auto overflow-x-hidden bg-[var(--brand-surface)] pb-8 text-[var(--brand-primary)]"
      style={buildThemeStyle(editorProfile)}
    >
      <div className="relative h-[142px] overflow-visible">
        <img src={editorProfile.cover} alt="" className="h-full w-full object-cover" draggable="false" />
        <div className="absolute inset-0 bg-black/10" />
        <button
          type="button"
          onClick={() => setCoverEditorOpen(true)}
          className="absolute bottom-8 right-5 z-20 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/90 px-3 text-xs font-bold text-[#6b433a] shadow-md shadow-black/10 ring-1 ring-white/70 transition active:scale-[0.98]"
        >
          <Camera size={15} />
          Trocar capa
        </button>
      </div>

      <button
        type="button"
        onClick={openExitConfirmation}
        className="fixed left-[max(1.75rem,calc((100vw-430px)/2+1.75rem))] top-[max(3rem,calc((100vh-932px)/2+3rem))] z-[180] grid size-9 place-items-center rounded-full bg-white/85 text-[var(--brand-primary)] shadow-lg shadow-black/15 ring-1 ring-white/70 transition active:scale-95"
        aria-label="Voltar ao cardapio"
      >
        <ArrowLeft size={20} strokeWidth={2} />
      </button>

      <div className="fixed right-[max(1.75rem,calc((100vw-430px)/2+1.75rem))] top-[max(3rem,calc((100vh-932px)/2+3rem))] z-[180] grid justify-items-end gap-2">
        <button
          type="button"
          onClick={() => setEditorActionsOpen((currentValue) => !currentValue)}
          className="grid size-9 place-items-center rounded-full bg-white/85 text-[var(--brand-primary)] shadow-lg shadow-black/15 ring-1 ring-white/70 transition active:scale-95"
          aria-label="Abrir ações do editor"
          aria-expanded={editorActionsOpen}
        >
          <Settings
            size={20}
            strokeWidth={2}
            className={`transition-transform duration-500 ease-out ${editorActionsOpen ? 'rotate-180' : 'rotate-0'}`}
          />
        </button>

        <div
          className={`absolute right-0 top-[54px] z-[190] grid w-[178px] origin-top-right gap-2 rounded-2xl border border-white/70 bg-white/95 p-2 shadow-2xl shadow-[#4b160e]/20 backdrop-blur transition-all duration-300 ease-out ${
            editorActionsOpen
              ? 'translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none -translate-y-2 scale-95 opacity-0'
          }`}
        >
          <button
            type="button"
            onClick={saveEditorProfile}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] text-[11px] font-black uppercase tracking-wide text-white"
          >
            <Save size={13} />
            Salvar
          </button>
          <button
            type="button"
            onClick={openExitConfirmation}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[var(--brand-primary)] bg-white text-[10px] font-black uppercase tracking-wide text-[var(--brand-primary)]"
          >
            <LogOut size={13} />
            Sair/descartar
          </button>
        </div>
      </div>

      <div className="relative z-20 -mt-6 rounded-t-[22px] bg-[var(--brand-surface)] px-5 pb-8 pt-5 shadow-[0_-14px_34px_rgba(67,22,15,0.10)]">
        <div className="relative">
          <div className="relative z-30 -mt-[68px] ml-0 w-fit">
            <img
              src={editorProfile.logo}
              alt={editorProfile.name}
              className="size-[96px] rounded-full object-cover"
              draggable="false"
            />
            <button
              type="button"
              onClick={() => setLogoEditorOpen(true)}
              className="absolute bottom-0 right-2 grid size-9 place-items-center rounded-full bg-slate-100 text-slate-700 ring-2 ring-white"
              aria-label="Alterar logo"
            >
              <Camera size={17} strokeWidth={2.5} />
            </button>
          </div>

          <button
            type="button"
            onClick={saveEditorProfile}
            className="absolute top-16 right-0 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-3.5 text-[11px] font-medium tracking-[0.01em] text-white shadow-md shadow-[#4b160e]/10 transition active:scale-[0.98]"
          >
            <Save size={14} strokeWidth={2} />
            Salvar alterações
          </button>

          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => setProfileEditorOpen(true)}
              className="flex h-8 w-full items-center gap-2 rounded-lg bg-slate-100 px-3 text-left text-sm font-semibold text-slate-600"
            >
              <Pencil size={14} strokeWidth={1.9} className="shrink-0 text-slate-400" aria-hidden="true" />
              <span className="truncate">{editorProfile.name}</span>
            </button>
            <button
              type="button"
              onClick={() => setProfileEditorOpen(true)}
              className="flex h-8 w-full items-center gap-2 rounded-lg bg-slate-100 px-3 text-left text-sm font-semibold text-slate-600"
            >
              <Pencil size={14} strokeWidth={1.9} className="shrink-0 text-slate-400" aria-hidden="true" />
              <span className="truncate">{editorProfile.location}</span>
            </button>
            <button
              type="button"
              onClick={() => setProfileEditorOpen(true)}
              className="flex h-8 w-full items-center gap-2 rounded-lg bg-slate-100 px-3 text-left text-xs font-black lowercase text-slate-500"
            >
              <LockKeyhole size={14} strokeWidth={1.9} className="shrink-0 text-slate-400" aria-hidden="true" />
              <span className="truncate">#{getPublicMenuHash(editorProfile.slug || editorProfile.name)}</span>
            </button>
          </div>
        </div>

        <div>
          <AdminEditorSectionTitle title="Cards de promoção" actionLabel="Adicionar" onAction={addPromo} useBrandFont />
        </div>
        <div className="-mx-5 mt-1 flex gap-3 overflow-x-auto px-5 pb-1">
          {editorPromos.map((slide) => {
            const locked = slide.id === protectedPromoSlideId

            return (
            <div
              key={slide.id}
              className="grid w-[390px] max-w-[calc(100vw-40px)] shrink-0 grid-cols-[1fr_92px] gap-2 rounded-lg bg-slate-100 p-2"
            >
              <div className="relative">
                <img
                  src={slide.image}
                  alt={slide.alt}
                  className="h-[108px] w-full rounded-md bg-[#4b160e] object-contain"
                  draggable="false"
                />
                {locked && (
                  <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[9px] font-black uppercase text-[#4b160e] shadow">
                    Fixo
                  </span>
                )}
              </div>
              {locked ? (
                <div className="grid content-center gap-2 rounded-lg bg-white/70 px-2 text-center text-[10px] font-black uppercase text-slate-500 ring-1 ring-slate-200">
                  <LockKeyhole size={18} className="mx-auto text-slate-500" />
                  Slide fixo
                  <span className="text-[9px] font-bold normal-case text-slate-400">Vezz protegido</span>
                </div>
              ) : (
                <AdminActionStack onEdit={() => editPromo(slide)} onRemove={() => requestRemovePromo(slide)} />
              )}
            </div>
            )
          })}
        </div>
        <div className="mt-1 flex justify-center gap-1.5">
          <span className="size-2 rounded-full bg-slate-300" />
          <span className="size-2 rounded-full bg-slate-300" />
          <span className="size-2 rounded-full bg-slate-300" />
        </div>

        <AdminEditorSectionTitle title="Categorias" actionLabel="Editar" onAction={openCategoriesEditor} useBrandFont />
        <div className="-mx-5 mt-3 overflow-hidden">
          <div className="flex gap-4 overflow-x-auto px-5 pb-2">
            {editorCategories.map((category) => (
              <div key={category.id} className="w-[164px] shrink-0">
                <button
                  type="button"
                  onClick={() => openCategoryProducts(category.id)}
                  className="block w-full overflow-hidden rounded-md bg-slate-100 text-left"
                >
                  <img src={category.image} alt="" className="h-[112px] w-full object-cover" draggable="false" />
                </button>
                <p className="font-montserrat mt-2 truncate text-center text-sm font-medium text-[#4b160e]">
                  {category.label.toUpperCase()}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <AdminMiniAction icon={Pencil} label="Editar" onClick={() => editCategory(category)} />
                  <AdminMiniAction icon={Trash2} label="Excluir" onClick={() => requestRemoveCategory(category)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <AdminEditorSectionTitle title="Destaques" actionLabel="Adicionar" onAction={() => startNewProduct()} useBrandFont />
        <div className="mt-3 space-y-3">
          {adminFeaturedProducts.map((product) => (
            <AdminProductEditorCard
              key={product.id}
              product={product}
              onEdit={() => editProduct(product)}
              onRemove={() => requestRemoveProduct(product)}
              onToggle={() => onToggleProductActive(product.id)}
            />
          ))}
        </div>

        <AdminEditorSectionTitle title="Pratos do dia" actionLabel="Adicionar" onAction={() => startNewProduct()} />
        <div className="mt-3 space-y-3">
          {adminDailyProducts.map((product) => (
            <AdminProductEditorCard
              key={product.id}
              product={product}
              onEdit={() => editProduct(product)}
              onRemove={() => requestRemoveProduct(product)}
              onToggle={() => onToggleProductActive(product.id)}
            />
          ))}
        </div>

      </div>

      {profileEditorOpen && (
        <AdminRestaurantProfileDialog
          profile={editorProfile}
          onCancel={() => setProfileEditorOpen(false)}
          onSave={(nextProfile) => {
            setEditorProfile(nextProfile)
            setProfileEditorOpen(false)
          }}
        />
      )}
      {coverEditorOpen && (
        <AdminCoverDialog
          cover={editorProfile.cover}
          onCancel={() => setCoverEditorOpen(false)}
          onSave={(cover) => {
            const nextProfile = { ...editorProfile, cover }
            setEditorProfile(nextProfile)
            onUpdateProfile?.(nextProfile)
            setCoverEditorOpen(false)
          }}
        />
      )}
      {logoEditorOpen && (
        <AdminLogoDialog
          logo={editorProfile.logo}
          onCancel={() => setLogoEditorOpen(false)}
          onSave={({ logo, theme }) => {
            const nextProfile = { ...editorProfile, logo, theme }
            setEditorProfile(nextProfile)
            onUpdateProfile?.(nextProfile)
            setLogoEditorOpen(false)
          }}
        />
      )}
      {exitConfirmOpen && (
        <AdminExitConfirmDialog
          onCancel={() => setExitConfirmOpen(false)}
          onDiscard={onBack}
          onSave={saveEditorProfile}
        />
      )}
      {deleteDialog}
    </section>
  )
}

function AdminEditorSectionTitle({ title, actionLabel, onAction, useBrandFont = false }) {
  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      <h2 className={`${useBrandFont ? 'font-montserrat text-[14px] font-medium tracking-[0.01em]' : 'text-sm font-black'} uppercase text-[var(--brand-primary)]`}>
        {title}
      </h2>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-100 px-3 text-[11px] font-black text-slate-700 transition active:scale-[0.98]"
        >
          <Plus size={14} strokeWidth={2.8} />
          {actionLabel}
        </button>
      )}
    </div>
  )
}

function readAdminImageFile(file, onReady, { maxWidth = 900, maxHeight = 900, quality = 0.76 } = {}) {
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    const originalUrl = String(reader.result || '')
    const image = new Image()

    image.onload = () => {
      const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight)
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))

      const context = canvas.getContext('2d')
      if (!context) {
        onReady(originalUrl)
        return
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      onReady(canvas.toDataURL('image/webp', quality))
    }

    image.onerror = () => onReady(originalUrl)
    image.src = originalUrl
  }
  reader.readAsDataURL(file)
}

function rgbToHex(red, green, blue) {
  return `#${[red, green, blue].map((value) => Math.round(value).toString(16).padStart(2, '0')).join('')}`
}

function colorLuminance([red, green, blue]) {
  return (red * 299 + green * 587 + blue * 114) / 1000
}

function colorDistance(first, second) {
  return Math.sqrt(first.reduce((total, value, index) => total + (value - second[index]) ** 2, 0))
}

function extractLogoTheme(imageUrl) {
  return new Promise((resolve) => {
    const image = new Image()

    image.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 96
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext('2d', { willReadFrequently: true })
      context.drawImage(image, 0, 0, size, size)

      const buckets = new Map()
      const pixels = context.getImageData(0, 0, size, size).data

      for (let index = 0; index < pixels.length; index += 4) {
        if (pixels[index + 3] < 150) continue

        const color = [pixels[index], pixels[index + 1], pixels[index + 2]]
        const luminance = colorLuminance(color)
        if (luminance > 248 || luminance < 7) continue

        const key = color.map((value) => Math.min(255, Math.round(value / 24) * 24)).join(',')
        const bucket = buckets.get(key) ?? { count: 0, sum: [0, 0, 0] }
        bucket.count += 1
        color.forEach((value, channel) => { bucket.sum[channel] += value })
        buckets.set(key, bucket)
      }

      const rankedColors = [...buckets.values()]
        .sort((first, second) => second.count - first.count)
        .map((bucket) => bucket.sum.map((total) => total / bucket.count))

      const distinctColors = []
      for (const color of rankedColors) {
        if (distinctColors.every((selected) => colorDistance(color, selected) >= 55)) distinctColors.push(color)
        if (distinctColors.length === 3) break
      }

      if (!distinctColors.length) {
        resolve(defaultRestaurantProfile.theme)
        return
      }

      while (distinctColors.length < 3) {
        distinctColors.push(distinctColors[distinctColors.length - 1])
      }

      const byLuminance = [...distinctColors].sort((first, second) => colorLuminance(first) - colorLuminance(second))
      resolve({
        primary: rgbToHex(...byLuminance[0]),
        accent: rgbToHex(...byLuminance[1]),
        surface: rgbToHex(...byLuminance[2]),
      })
    }

    image.onerror = () => resolve(defaultRestaurantProfile.theme)
    image.src = imageUrl
  })
}

function AdminCoverDialog({ cover, onCancel, onSave }) {
  const [preview, setPreview] = useState(cover)
  const [fileName, setFileName] = useState('')
  const inputRef = useRef(null)

  function selectCover(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    readAdminImageFile(file, setPreview, { maxWidth: 1200, maxHeight: 480, quality: 0.78 })
    event.target.value = ''
  }

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-white/80 px-6 backdrop-blur-[2px]">
      <section className="w-full max-w-[390px] rounded-[22px] border border-[#4b160e] bg-white p-5 shadow-2xl shadow-[#4b160e]/15">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-montserrat text-lg font-medium text-[#4b160e]">Trocar foto da capa</h2>
          <button type="button" onClick={onCancel} className="grid size-9 place-items-center rounded-lg bg-slate-100 text-[#6b433a]" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <p className="mt-2 text-sm font-normal leading-5 text-[#8b6d66]">
          Escolha uma foto horizontal de 1200 × 400 px para obter melhor resolução.
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-5 block w-full overflow-hidden rounded-xl border border-dashed border-[#b7928b] bg-[#faf8f7] p-2 text-center"
        >
          <img src={preview} alt="Prévia da capa" className="h-[160px] w-full rounded-lg object-cover" draggable="false" />
          <span className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-[#4b160e] px-5 text-sm font-medium text-white">
            <Camera size={17} />
            Escolher foto
          </span>
          <span className="mt-2 block truncate px-3 text-xs font-normal text-[#8b6d66]">
            {fileName || 'Envie uma imagem JPG ou PNG'}
          </span>
        </button>
        <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="sr-only" onChange={selectCover} />

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} className="h-10 rounded-full border border-[#4b160e] text-sm font-medium text-[#4b160e]">
            Cancelar
          </button>
          <button type="button" onClick={() => onSave(preview)} disabled={!fileName} className="h-10 rounded-full bg-[#4b160e] text-sm font-medium text-white disabled:opacity-40">
            Usar foto
          </button>
        </div>
      </section>
    </div>
  )
}

function AdminLogoDialog({ logo, onCancel, onSave }) {
  const [preview, setPreview] = useState(logo)
  const [fileName, setFileName] = useState('')
  const [detectedTheme, setDetectedTheme] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const inputRef = useRef(null)

  function selectLogo(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setAnalyzing(true)
    readAdminImageFile(file, async (imageUrl) => {
      setPreview(imageUrl)
      setDetectedTheme(await extractLogoTheme(imageUrl))
      setAnalyzing(false)
    }, { maxWidth: 640, maxHeight: 640, quality: 0.8 })
    event.target.value = ''
  }

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-white/80 px-6 backdrop-blur-[2px]">
      <section className="w-full max-w-[390px] rounded-[22px] border border-[#4b160e] bg-white p-5 shadow-2xl shadow-[#4b160e]/15">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-montserrat text-lg font-medium text-[#4b160e]">Trocar foto da logo</h2>
          <button type="button" onClick={onCancel} className="grid size-9 place-items-center rounded-lg bg-slate-100 text-[#6b433a]" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <p className="mt-2 text-sm font-normal leading-5 text-[#8b6d66]">
          Escolha uma foto quadrada de 800 × 800 px para obter melhor resolução.
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-5 block w-full rounded-xl border border-dashed border-[#b7928b] bg-[#faf8f7] p-5 text-center"
        >
          <img src={preview} alt="Prévia da logo" className="mx-auto size-[160px] rounded-full bg-[#4b160e] object-cover" draggable="false" />
          <span className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-[#4b160e] px-5 text-sm font-medium text-white">
            <Camera size={17} />
            Escolher foto
          </span>
          <span className="mt-2 block truncate px-3 text-xs font-normal text-[#8b6d66]">
            {analyzing ? 'Identificando as três cores principais...' : fileName || 'Envie uma imagem JPG ou PNG'}
          </span>
        </button>
        <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="sr-only" onChange={selectLogo} />

        {detectedTheme && (
          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-center">
            <p className="text-xs font-medium text-[#6b433a]">Selecione ou ajuste as três cores da logo</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                ['primary', 'Principal'],
                ['accent', 'Destaque'],
                ['surface', 'Fundo'],
              ].map(([field, label]) => (
                <label key={field} className="grid justify-items-center gap-1.5 text-[10px] font-medium text-slate-600">
                  <input
                    type="color"
                    value={detectedTheme[field]}
                    onChange={(event) => setDetectedTheme((current) => ({ ...current, [field]: event.target.value }))}
                    className="size-10 cursor-pointer rounded-full border-0 bg-transparent p-0"
                    aria-label={`Cor ${label.toLowerCase()}`}
                  />
                  <span>{label}</span>
                  <span className="font-mono text-[8px] text-slate-400">{detectedTheme[field]}</span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-4 text-slate-500">A cor principal será usada somente nas bordas das fotos e nos textos. O fundo permanecerá branco.</p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} className="h-10 rounded-full border border-[#4b160e] text-sm font-medium text-[#4b160e]">
            Cancelar
          </button>
          <button type="button" onClick={() => onSave({ logo: preview, theme: detectedTheme })} disabled={!fileName || analyzing || !detectedTheme} className="h-10 rounded-full bg-[#4b160e] text-sm font-medium text-white disabled:opacity-40">
            Usar foto
          </button>
        </div>
      </section>
    </div>
  )
}

function AdminRestaurantProfileDialog({ profile, onCancel, onSave }) {
  const [draft, setDraft] = useState(() => normalizeRestaurantProfile(profile))
  const coverInputRef = useRef(null)
  const logoInputRef = useRef(null)
  const draftTheme = normalizeRestaurantProfile(draft).theme

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function updateThemeField(field, value) {
    setDraft((current) => ({
      ...current,
      theme: {
        ...defaultRestaurantProfile.theme,
        ...(current.theme ?? {}),
        [field]: value,
      },
    }))
  }

  function updateImage(field, event) {
    const file = event.target.files?.[0]

    readAdminImageFile(file, async (imageUrl) => {
      if (field !== 'logo') {
        updateField(field, imageUrl)
        return
      }

      const theme = await extractLogoTheme(imageUrl)
      setDraft((current) => ({ ...current, logo: imageUrl, theme }))
    }, field === 'logo'
      ? { maxWidth: 640, maxHeight: 640, quality: 0.8 }
      : { maxWidth: 1200, maxHeight: 480, quality: 0.78 })
    event.target.value = ''
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/76 px-5 py-8 backdrop-blur-[2px] md:absolute">
      <section
        className="w-full rounded-[22px] border border-[var(--brand-primary)] bg-white p-5 shadow-2xl shadow-[#4b160e]/15"
        style={buildThemeStyle(draft)}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-[var(--brand-primary)]">Editar restaurante</h2>
            <p className="mt-1 text-xs font-semibold text-[#8b6d66]">
              Atualize as informações exibidas no cardápio.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="grid size-9 place-items-center rounded-lg bg-slate-100 text-[#6b433a]"
            aria-label="Fechar edição do restaurante"
          >
            x
          </button>
        </div>

        <div className="mt-5">
          <div className="relative overflow-hidden rounded-xl bg-[var(--brand-primary)]">
            <img src={draft.cover} alt="" className="h-[132px] w-full object-cover" draggable="false" />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="absolute bottom-3 right-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/95 px-3 text-xs font-bold text-[#6b433a] shadow"
            >
              <Camera size={15} />
              Trocar capa
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => updateImage('cover', event)}
            />
          </div>

          <div className="mt-4 grid grid-cols-[88px_1fr] items-center gap-4">
            <div className="relative">
              <img
                src={draft.logo}
                alt=""
                className="size-[88px] rounded-full border-[3px] border-[var(--brand-accent)] bg-[var(--brand-primary)] object-cover"
                draggable="false"
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full bg-slate-100 text-[#6b433a] ring-2 ring-white"
                aria-label="Trocar logo"
              >
                <Camera size={15} />
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => updateImage('logo', event)}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black uppercase text-[#6b433a]">
                Nome
                <input
                  value={draft.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-[#b7928b] px-3 text-sm font-semibold text-[var(--brand-primary)] outline-none"
                />
              </label>
              <label className="block text-xs font-black uppercase text-[#6b433a]">
                Localização
                <input
                  value={draft.location}
                  onChange={(event) => updateField('location', event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-[#b7928b] px-3 text-sm font-semibold text-[var(--brand-primary)] outline-none"
                />
              </label>
            </div>
          </div>

          <label className="mt-4 block text-xs font-black uppercase text-[#6b433a]">
            Sublink do cardapio
            <div className="mt-1 grid h-10 grid-cols-[92px_1fr] overflow-hidden rounded-lg border border-[#b7928b] bg-white">
              <span className="grid place-items-center bg-[#f4efed] text-[11px] font-black lowercase text-[#8b6d66]">
                #cardapio-
              </span>
              <input
                value={draft.slug ?? ''}
                onChange={(event) => updateField('slug', event.target.value)}
                onBlur={(event) => updateField('slug', slugifyMenuName(event.target.value || draft.name))}
                className="min-w-0 px-3 text-sm font-semibold lowercase text-[var(--brand-primary)] outline-none"
              />
            </div>
            <span className="mt-1 block truncate text-[10px] font-semibold normal-case text-[#9b817a]">
              {buildPublicMenuUrl(draft.slug || draft.name)}
            </span>
          </label>

          <div className="mt-4 rounded-xl border border-[#eadfd9] bg-[#fbf8f6] p-3">
            <h3 className="text-xs font-black uppercase text-[#6b433a]">Padrao de cores</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                ['primary', 'Principal'],
                ['accent', 'Destaque'],
                ['surface', 'Fundo'],
              ].map(([field, label]) => (
                <label key={field} className="grid gap-1 text-[10px] font-black uppercase text-[#8b6d66]">
                  {label}
                  <span className="grid h-10 grid-cols-[38px_1fr] overflow-hidden rounded-lg border border-[#d8c7bf] bg-white">
                    <input
                      type="color"
                      value={draftTheme[field]}
                      onChange={(event) => updateThemeField(field, event.target.value)}
                      className="h-10 w-full cursor-pointer border-0 bg-transparent p-1"
                      aria-label={`Cor ${label.toLowerCase()}`}
                    />
                    <span className="grid place-items-center text-[10px] font-bold normal-case text-[#6b433a]">
                      {draftTheme[field]}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-full border border-[var(--brand-primary)] text-sm font-black text-[var(--brand-primary)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave(normalizeRestaurantProfile(draft))}
            className="h-10 rounded-full bg-[var(--brand-primary)] text-sm font-black text-white"
          >
            Salvar
          </button>
        </div>
      </section>
    </div>
  )
}

function AdminExitConfirmDialog({ onCancel, onDiscard, onSave }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/76 px-7 backdrop-blur-[2px] md:absolute">
      <section className="w-full rounded-[22px] border border-[#4b160e] bg-white px-6 py-6 text-center shadow-2xl shadow-[#4b160e]/15">
        <h2 className="text-xl font-black leading-7 text-[#5a2a22]">Salvar alterações antes de sair?</h2>
        <p className="mt-2 text-sm font-semibold leading-5 text-[#8b6d66]">
          Você pode publicar as mudanças agora ou voltar ao cardápio sem aplicar.
        </p>
        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={onSave}
            className="h-11 w-full rounded-full bg-[#4b160e] text-sm font-black uppercase tracking-wide text-white"
          >
            Salvar e sair
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="h-10 w-full rounded-full border border-[#4b160e] bg-white text-sm font-black uppercase tracking-wide text-[#4b160e]"
          >
            Descartar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-10 w-full rounded-full bg-slate-100 text-sm font-black uppercase tracking-wide text-slate-600"
          >
            Continuar editando
          </button>
        </div>
      </section>
    </div>
  )
}

function AdminActionStack({ disabled = false, onEdit, onRemove }) {
  return (
    <div className="grid content-center gap-2">
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-slate-200 text-xs font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Trash2 size={16} className="text-red-600" />
        Excluir
      </button>
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-slate-200 text-xs font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Pencil size={16} />
        Editar
      </button>
    </div>
  )
}

function AdminMiniAction({ icon: Icon, label, disabled = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 items-center justify-center gap-1 rounded-md bg-slate-200 text-[10px] font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <Icon size={13} className={label === 'Excluir' ? 'text-red-600' : undefined} />
      {label}
    </button>
  )
}

function AdminProductEditorCard({ product, onEdit, onRemove, onToggle }) {
  return (
    <article className="grid h-[120px] w-full grid-cols-[1fr_130px] gap-3 overflow-hidden rounded-lg bg-[#f0f0f0] p-3 text-left">
      <div className="flex min-w-0 flex-col overflow-hidden">
        <h3 className="truncate text-[13px] font-bold leading-tight text-[#4b160e]" title={product.name}>
          {product.name.toUpperCase()}
        </h3>
        <p className="mt-1 line-clamp-3 max-h-[51px] overflow-hidden text-[12.5px] font-normal leading-[17px] text-[#4b2a22]">
          {product.description}
        </p>
        <p className="mt-1 text-[13px] font-bold text-[#4b160e]">{formatCurrency(product.price)}</p>
      </div>

      <div className="relative h-[96px] self-center overflow-hidden rounded-lg bg-transparent">
        <img
          src={product.image}
          alt=""
          className={`block size-full object-cover object-center ${product.id === 'camarao-coco-brasil' ? 'scale-[1.14]' : ''}`}
          draggable="false"
        />
        <div className="absolute right-1.5 top-1.5 flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="grid size-7 place-items-center rounded-full bg-white/95 text-slate-600 shadow-sm"
            aria-label={`Editar ${product.name}`}
          >
            <Pencil size={13} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="grid size-7 place-items-center rounded-full bg-white/95 text-slate-600 shadow-sm"
            aria-label={`Excluir ${product.name}`}
          >
            <Trash2 size={13} strokeWidth={2} className="text-red-600" />
          </button>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`absolute bottom-1.5 right-1.5 h-6 rounded-full px-2 text-[8px] font-bold shadow-sm ${
            product.active === false ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
          }`}
        >
          {product.active === false ? 'INATIVO' : 'ATIVO'}
        </button>
      </div>
    </article>
  )
}

function AdminPromoEditScreen({ promo, products = [], restaurantProfile = defaultRestaurantProfile, onBack, onSave }) {
  const [draft, setDraft] = useState(() => ({
    ...promo,
    alt: promo?.alt ?? 'Card promocional',
    targetType: promo?.targetType ?? 'promotion',
    targetUrl: promo?.targetUrl ?? '',
  }))
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false)
  const imageInputRef = useRef(null)
  const selectableProducts = products

  function updatePromoImage(event) {
    const file = event.target.files?.[0]

    readAdminImageFile(file, (imageUrl) => {
      setDraft((current) => ({ ...current, image: imageUrl, fit: 'contain' }))
    }, { maxWidth: 960, maxHeight: 540, quality: 0.72 })
    event.target.value = ''
  }

  function updateDestinationType(targetType) {
    setDraft((current) => ({
      ...current,
      targetType,
      targetUrl: targetType === 'link' ? current.targetUrl : '',
      productId: targetType === 'promotion' ? current.productId : targetType === 'product' ? (current.productId || selectableProducts[0]?.id || '') : '',
    }))
  }

  return (
    <section className="relative h-full overflow-y-auto overflow-x-hidden bg-white pb-3 text-[#4b160e]">
      <TopPhotoBar backgroundImage={restaurantProfile.cover} onBack={onBack} onOpenSettings={onBack} compact />

      <div className="relative z-10 -mt-[84px] min-h-[calc(100%-60px)] rounded-t-[20px] bg-white px-7 pb-4 pt-5 shadow-[0_-10px_28px_rgba(67,22,15,0.08)]">
        <div className="relative overflow-hidden rounded-[8px] bg-[#4b160e]">
          <img
            src={draft.image}
            alt=""
            className="h-[178px] w-full object-contain"
            draggable="false"
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="absolute bottom-3 right-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/95 px-3 text-xs font-bold text-[#8f746d] shadow"
          >
            <Camera size={15} />
            Trocar foto
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={updatePromoImage}
          />
        </div>

        <label className="mt-4 block text-sm font-black text-[#6b433a]">
          Nome do card
          <input
            value={draft.alt}
            onChange={(event) => setDraft((current) => ({ ...current, alt: event.target.value }))}
            className="mt-1 h-10 w-full rounded-lg border border-[#b7928b] px-3 text-sm font-semibold text-[#4b160e] outline-none"
          />
        </label>

        <section className="mt-4 rounded-xl border border-[#eadfd9] bg-[#fbf7f2] p-3">
          <h2 className="text-sm font-black text-[#6b433a]">Direcionamento do clique</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              ['promotion', 'Promoção'],
              ['product', 'Prato'],
              ['link', 'Link'],
            ].map(([targetType, label]) => (
              <button
                type="button"
                key={targetType}
                onClick={() => updateDestinationType(targetType)}
                aria-pressed={draft.targetType === targetType}
                className={`h-9 rounded-lg text-[11px] font-black transition active:scale-[0.98] ${
                  draft.targetType === targetType
                    ? 'bg-[#4b160e] text-white'
                    : 'bg-white text-[#6b433a] ring-1 ring-[#eadfd9]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {draft.targetType === 'promotion' && (
            <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold leading-5 text-[#8b6d66] ring-1 ring-[#eadfd9]">
              Ao clicar, o cliente verá a tela explicando a promoção, condições e itens inclusos.
            </p>
          )}

          {draft.targetType === 'product' && (
            <label className="mt-3 block text-xs font-black uppercase text-[#6b433a]">
              Prato de destino
              <select
                value={draft.productId ?? ''}
                onChange={(event) => setDraft((current) => ({ ...current, productId: event.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-[#b7928b] bg-white px-3 text-sm font-semibold normal-case text-[#4b160e] outline-none"
              >
                {selectableProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {draft.targetType === 'link' && (
            <label className="mt-3 block text-xs font-black uppercase text-[#6b433a]">
              Link externo
              <input
                type="url"
                value={draft.targetUrl}
                onChange={(event) => setDraft((current) => ({ ...current, targetUrl: event.target.value }))}
                placeholder="https://..."
                className="mt-1 h-10 w-full rounded-lg border border-[#b7928b] px-3 text-sm font-semibold normal-case text-[#4b160e] outline-none placeholder:text-[#b6a4a0]"
              />
            </label>
          )}
        </section>

        <button
          type="button"
          onClick={() => setSaveConfirmOpen(true)}
          className="mx-auto mt-6 flex h-10 w-[90%] items-center justify-center rounded-full bg-[#4b160e] text-base font-semibold text-white"
        >
          Salvar alterações
        </button>
      </div>

      {saveConfirmOpen && (
        <AdminConfirmDialog
          title="Você tem certeza que deseja salvar as alterações?"
          confirmLabel="Salvar"
          onCancel={() => setSaveConfirmOpen(false)}
          onConfirm={() => onSave(draft)}
        />
      )}
    </section>
  )
}

function AdminProductEditScreen({ categories, fallbackCategory, product, restaurantProfile = defaultRestaurantProfile, onBack, onSave }) {
  const [draft, setDraft] = useState(() => buildAdminProductDraft(product, fallbackCategory || categories[0]?.id))
  const [allergenOpen, setAllergenOpen] = useState(false)
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false)
  const [deleteOptionId, setDeleteOptionId] = useState('')
  const [optionDraft, setOptionDraft] = useState(null)
  const imageInputRef = useRef(null)
  const previewImage = draft.image || fallbackImages[draft.category] || categoriaFrutosDoMar

  function updateDraftField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function updateProductImage(event) {
    const file = event.target.files?.[0]

    readAdminImageFile(
      file,
      (imageUrl) => updateDraftField('image', imageUrl),
      { maxWidth: 720, maxHeight: 720, quality: 0.7 },
    )
    event.target.value = ''
  }

  function toggleTag(tag) {
    setDraft((current) => ({
      ...current,
      tags: current.tags.includes(tag)
        ? current.tags.filter((item) => item !== tag)
        : [...current.tags, tag],
    }))
  }

  function removeTag(tag) {
    setDraft((current) => ({
      ...current,
      tags: current.tags.filter((item) => item !== tag),
    }))
  }

  function editOption(option) {
    setOptionDraft({ ...option })
  }

  function startOption() {
    setOptionDraft({
      id: `opt-${Date.now()}`,
      people: '',
      detail: '',
      price: '',
    })
  }

  function concludeOption() {
    if (!optionDraft?.people || !optionDraft?.price) return

    setDraft((current) => {
      const exists = current.options.some((option) => option.id === optionDraft.id)
      const nextOption = {
        ...optionDraft,
        label: `${optionDraft.people} ${Number(optionDraft.people) === 1 ? 'pessoa' : 'pessoas'}`,
      }

      return {
        ...current,
        options: exists
          ? current.options.map((option) => (option.id === optionDraft.id ? nextOption : option))
          : [...current.options, nextOption],
      }
    })
    setOptionDraft(null)
  }

  function removeOption(optionId) {
    setDraft((current) => ({
      ...current,
      options: current.options.filter((option) => option.id !== optionId),
    }))
    setDeleteOptionId('')
  }

  function confirmSave() {
    onSave(buildAdminProductPayload(draft, product))
  }

  return (
    <section className="relative h-full overflow-y-auto overflow-x-hidden bg-white pb-7 text-[#4b160e]">
      <TopPhotoBar backgroundImage={restaurantProfile.cover} onBack={onBack} onOpenSettings={onBack} compact />

      <div className="relative z-10 -mt-9 rounded-t-[22px] bg-white px-8 pb-8 pt-7 shadow-[0_-14px_34px_rgba(67,22,15,0.10)]">
        <div className="relative overflow-hidden rounded-lg bg-[#4b160e]">
          <img
            src={previewImage}
            alt=""
            className="h-[154px] w-full object-cover"
            draggable="false"
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="absolute bottom-2.5 right-2.5 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/95 px-3 text-[11px] font-medium text-[#8f746d] shadow"
          >
            <Camera size={15} />
            Trocar foto
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={updateProductImage}
          />
        </div>

        <label className="mt-2.5 block text-[13px] font-bold text-[#6b433a]">
          Nome do prato
          <input
            value={draft.name}
            onChange={(event) => updateDraftField('name', event.target.value)}
            placeholder="Nome do prato"
            className="mt-1 h-9 w-full rounded-[8px] border border-[#b7928b] px-3 text-[13px] font-normal text-[#6b433a] outline-none"
          />
        </label>

        <label className="mt-2.5 block text-[13px] font-bold text-[#6b433a]">
          Descrição
          <textarea
            value={draft.description}
            onChange={(event) => updateDraftField('description', event.target.value)}
            placeholder="Descrição do prato"
            className="mt-1 h-[100px] w-full resize-none rounded-[8px] border border-[#b7928b] px-3 py-2.5 text-[13px] font-normal leading-[18px] text-[#6b433a] outline-none"
          />
        </label>

        <div className="mt-3">
          <h2 className="text-[13px] font-bold text-[#6b433a]">Alergênicos</h2>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {draft.tags.map((tag) => (
              <AdminAllergenChip key={tag} label={tag} onRemove={() => removeTag(tag)} />
            ))}
            <button
              type="button"
              onClick={() => setAllergenOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#b7928b] px-3 text-[11px] font-medium text-[#8b6d66]"
            >
              Adicionar
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="mt-3">
          <h2 className="text-[13px] font-bold text-[#6b433a]">Opções de porções e preços</h2>
          <div className="mt-1.5 space-y-1.5">
            {draft.options.map((option) => (
              <AdminPortionOptionRow
                key={option.id}
                option={option}
                onEdit={() => editOption(option)}
                onRemove={() => setDeleteOptionId(option.id)}
              />
            ))}

            {optionDraft && (
              <div className="grid grid-cols-[.8fr_1fr_1.15fr_auto] gap-2 rounded-lg border border-[#b7928b] bg-[#f5e7d2] px-2.5 py-1.5">
                <label className="text-[10px] font-medium">
                  Pessoas
                  <input
                    value={optionDraft.people}
                    onChange={(event) => setOptionDraft((current) => ({ ...current, people: event.target.value }))}
                    className="mt-0.5 h-6 w-full rounded border border-[#b7928b] px-1.5 text-[11px] outline-none"
                  />
                </label>
                <label className="text-[10px] font-medium">
                  Peso
                  <input
                    value={optionDraft.detail}
                    onChange={(event) => setOptionDraft((current) => ({ ...current, detail: event.target.value }))}
                    className="mt-0.5 h-6 w-full rounded border border-[#b7928b] px-1.5 text-[11px] outline-none"
                  />
                </label>
                <label className="text-[10px] font-medium">
                  Preço
                  <input
                    value={optionDraft.price}
                    onChange={(event) => setOptionDraft((current) => ({ ...current, price: event.target.value }))}
                    className="mt-0.5 h-6 w-full rounded border border-[#b7928b] px-1.5 text-[11px] outline-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={concludeOption}
                  className="mt-[15px] h-6 rounded bg-[#4b160e] px-3 text-[11px] font-medium text-white"
                >
                  Concluir
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={startOption}
          className="mx-auto mt-3.5 flex h-9 w-[94%] items-center justify-center gap-2 rounded-full bg-[#4b160e] text-[15px] font-medium text-white"
        >
          Adicionar
          <Plus size={16} fill="white" />
        </button>
        <button
          type="button"
          onClick={() => setSaveConfirmOpen(true)}
          className="mx-auto mt-2 flex h-9 w-[94%] items-center justify-center rounded-full border border-[#4b160e] bg-white text-[15px] font-medium text-[#4b160e]"
        >
          Salvar alterações
        </button>
      </div>

      {allergenOpen && (
        <AdminAllergenDialog
          selectedTags={draft.tags}
          onClose={() => setAllergenOpen(false)}
          onToggle={toggleTag}
        />
      )}
      {deleteOptionId && (
        <AdminConfirmDialog
          title="Você tem certeza que deseja excluir?"
          confirmLabel="Excluir"
          onCancel={() => setDeleteOptionId('')}
          onConfirm={() => removeOption(deleteOptionId)}
        />
      )}
      {saveConfirmOpen && (
        <AdminConfirmDialog
          title="Você tem certeza que deseja salvar as alterações?"
          confirmLabel="Salvar"
          onCancel={() => setSaveConfirmOpen(false)}
          onConfirm={confirmSave}
        />
      )}
    </section>
  )
}

function AdminCategoryEditScreen({ category, restaurantProfile = defaultRestaurantProfile, onBack, onSave }) {
  const [draft, setDraft] = useState(() => ({ ...category }))
  const imageInputRef = useRef(null)
  const iconInputRef = useRef(null)

  function updateCategoryImage(event) {
    const file = event.target.files?.[0]

    readAdminImageFile(
      file,
      (imageUrl) => setDraft((current) => ({ ...current, image: imageUrl })),
      { maxWidth: 900, maxHeight: 620, quality: 0.76 },
    )
    event.target.value = ''
  }

  function updateCategoryIcon(event) {
    const file = event.target.files?.[0]

    readAdminImageFile(
      file,
      (iconImage) => setDraft((current) => ({ ...current, iconImage })),
      { maxWidth: 360, maxHeight: 360, quality: 0.82 },
    )
    event.target.value = ''
  }

  function submitCategory(event) {
    event.preventDefault()
    const label = draft.label.trim()
    if (!label) return

    onSave({
      ...draft,
      label,
      shortLabel: label,
    })
  }

  return (
    <section className="relative h-full overflow-y-auto bg-white pb-8 text-[#43160f]">
      <TopPhotoBar backgroundImage={restaurantProfile.cover} onBack={onBack} onOpenSettings={onBack} compact />
      <form onSubmit={submitCategory} className="relative z-10 -mt-8 min-h-[calc(100%-88px)] rounded-t-[34px] bg-white px-5 pb-8 pt-7 shadow-[0_-14px_34px_rgba(67,22,15,0.10)]">
        <h1 data-screen-title="true" tabIndex={-1} className="font-montserrat text-center text-[18px] font-medium outline-none">
          EDITAR CATEGORIA
        </h1>
        <p className="mt-2 text-center text-xs leading-5 text-[#8f746d]">
          Altere o nome, a foto e o ícone exibidos no cardápio.
        </p>

        <div className="relative mt-6 overflow-hidden rounded-xl border-[3px] border-[var(--brand-primary)] bg-slate-100">
          <img src={draft.image} alt={`Imagem de ${draft.label}`} className="aspect-[1.47] w-full object-cover" draggable="false" />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="absolute bottom-3 right-3 inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-xs font-semibold text-[var(--brand-primary)] shadow-md"
          >
            <Camera size={16} />
            Trocar imagem
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            className="sr-only"
            onChange={updateCategoryImage}
          />
        </div>
        <p className="mt-2 text-center text-[11px] text-[#9a7d76]">Use JPG ou PNG, preferencialmente na proporção 900 × 620.</p>

        <div className="mt-6 rounded-2xl border border-[#dcc7c2] bg-[#fbf8f7] p-4">
          <p className="text-sm font-medium text-[#6b433a]">Ícone da categoria</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="grid size-24 shrink-0 place-items-center rounded-full bg-white shadow-sm">
              <img src={draft.iconImage} alt={`Ícone de ${draft.label}`} className="size-20 object-contain" draggable="false" />
            </div>
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => iconInputRef.current?.click()}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[var(--brand-primary)] bg-white px-3 text-xs font-semibold text-[var(--brand-primary)]"
              >
                <Camera size={16} />
                Trocar ícone
              </button>
              <p className="mt-2 text-[10px] leading-4 text-[#9a7d76]">Prefira PNG quadrado, 360 × 360, com fundo transparente.</p>
            </div>
          </div>
          <input
            ref={iconInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            className="sr-only"
            onChange={updateCategoryIcon}
          />
        </div>

        <label className="mt-6 block text-sm font-medium text-[#6b433a]">
          Nome da categoria
          <input
            type="text"
            required
            maxLength={40}
            value={draft.label}
            onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
            className="mt-2 h-12 w-full rounded-xl border border-[#c9aaa3] bg-white px-4 text-base text-[#43160f] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[color:var(--brand-primary)]/15"
            placeholder="Ex.: Entradas"
          />
        </label>

        <button type="submit" className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-primary)] text-sm font-semibold text-white shadow-sm">
          <Save size={17} />
          Salvar alterações
        </button>
      </form>
    </section>
  )
}

function AdminCategoriesEditorScreen({
  categories,
  restaurantProfile = defaultRestaurantProfile,
  onAddCategory,
  onBack,
  onEditCategory,
  onRemoveCategory,
}) {
  return (
    <section className="relative h-full overflow-y-auto bg-white pb-8 text-[#43160f]">
      <TopPhotoBar backgroundImage={restaurantProfile.cover} onBack={onBack} onOpenSettings={onBack} compact />
      <div className="relative z-10 -mt-8 rounded-t-[34px] bg-white px-4 pb-8 pt-10 shadow-[0_-14px_34px_rgba(67,22,15,0.10)]">
        <img
          src={restaurantProfile.logo}
          alt={restaurantProfile.name}
          loading="eager"
          decoding="sync"
          className="absolute left-1/2 top-[-70px] z-20 size-[96px] -translate-x-1/2 rounded-full bg-[#4a160f]"
          draggable="false"
        />
        <h1 data-screen-title="true" tabIndex={-1} className="font-montserrat text-center text-[17px] font-medium leading-none outline-none">
          CATEGORIAS
        </h1>
        <div className="mt-6 grid grid-cols-2 gap-x-2 gap-y-2">
          {categories.map((category) => (
            <div key={category.id} className="relative text-center">
              <button
                type="button"
                onClick={() => onEditCategory(category)}
                className="block w-full text-center transition active:scale-[0.99]"
              >
                <span className="relative block">
                  <span className="block aspect-[1.47] overflow-hidden rounded-lg border-[3px] border-[#4b160e] bg-white">
                    <img
                      src={category.image}
                      alt=""
                      loading="eager"
                      decoding="sync"
                      className="block size-full object-cover object-center"
                      draggable="false"
                    />
                  </span>
                  <img
                    src={category.iconImage}
                    alt=""
                    className="absolute bottom-[-17px] left-1/2 z-10 size-[48px] -translate-x-1/2 object-contain"
                    draggable="false"
                  />
                </span>
                <span className="font-montserrat mt-4 flex min-h-5 items-start justify-center text-center text-[12px] font-medium leading-tight">
                  {category.label.toUpperCase()}
                </span>
              </button>
              <div className="absolute right-2 top-2 z-20 flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onEditCategory(category)}
                  aria-label={`Editar ${category.label}`}
                  className="grid size-7 place-items-center rounded-full bg-white/95 text-[#4b160e] shadow"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveCategory(category)}
                  aria-label={`Excluir ${category.label}`}
                  className="grid size-7 place-items-center rounded-full bg-white/95 text-[#4b160e] shadow"
                >
                  <Trash2 size={14} className="text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onAddCategory}
        aria-label="Adicionar categoria"
        className="sticky bottom-4 z-30 ml-auto mr-4 grid size-12 place-items-center rounded-full bg-[#4b160e] text-[#d8ad61] shadow-lg"
      >
        <Plus size={23} />
      </button>
    </section>
  )
}

function AdminCategoryProductsEditorScreen({
  category,
  products,
  restaurantProfile = defaultRestaurantProfile,
  onAddProduct,
  onBack,
  onEditProduct,
  onRemoveProduct,
}) {
  const groupedProducts = groupProductsByMenuSection(products, category)

  return (
    <section className="relative h-full overflow-y-auto bg-white pb-8 text-[#43160f]" aria-labelledby="admin-category-products-title">
      <TopPhotoBar backgroundImage={restaurantProfile.cover} onBack={onBack} onOpenSettings={onBack} compact />
      <div className="relative z-10 -mt-8 rounded-t-[34px] bg-white px-4 pb-8 pt-[60px] shadow-[0_-14px_34px_rgba(67,22,15,0.10)]">
        <div className="absolute left-1/2 top-[-68px] grid size-[92px] -translate-x-1/2 place-items-center">
          <img src={category.iconImage} alt="" className="block size-[92px] object-contain" draggable="false" />
        </div>

        <h1 id="admin-category-products-title" data-screen-title="true" tabIndex={-1} className="font-anton -translate-y-7 text-center text-[21px] font-normal tracking-[0.02em] outline-none">
          {category.label.toUpperCase()}
        </h1>

        <div className="-mt-2 space-y-5">
          {groupedProducts.length ? (
            groupedProducts.map((group) => (
              <section key={group.title}>
                {normalizeText(group.title) !== normalizeText(category.label) && (
                  <h2 className="mb-2 min-h-[20px] px-1 text-[17px] font-black">{group.title}</h2>
                )}
                <div className="space-y-2.5">
                  {group.products.map((product) => (
                    <AdminCategoryProductCard
                      key={product.id}
                      product={product}
                      onEdit={() => onEditProduct(product)}
                      onRemove={() => onRemoveProduct(product)}
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <p className="rounded-lg bg-[#f0f0f0] p-4 text-sm font-bold text-[#7d6259]">
              Nenhum prato cadastrado nesta categoria.
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onAddProduct}
        aria-label="Adicionar prato"
        className="sticky bottom-4 z-30 ml-auto mr-4 grid size-12 place-items-center rounded-full bg-[#4b160e] text-[#d8ad61] shadow-lg"
      >
        <Plus size={23} />
      </button>
    </section>
  )
}

function AdminCategoryProductCard({ product, onEdit, onRemove }) {
  return (
    <article className="grid h-[116px] w-full grid-cols-[1fr_130px] gap-3 overflow-hidden rounded-lg bg-[#f0f0f0] p-3 text-left">
      <div className="grid min-w-0 grid-rows-[auto_1fr_auto] self-stretch overflow-hidden">
        <h3 className="truncate text-[13px] font-bold leading-tight" title={product.name}>
          {product.name.toUpperCase()}
        </h3>
        <p className="line-clamp-3 max-h-[51px] self-center overflow-hidden text-[12.5px] font-normal leading-[17px]">{product.description}</p>
        <p className="text-[13px] font-bold">{formatCurrency(product.price)}</p>
      </div>
      <div className="relative h-[90px] self-center overflow-hidden rounded-lg bg-[#4b160e]">
        <img src={product.image} alt="" className="block size-full scale-[1.03] object-cover" draggable="false" />
        <div className="absolute right-1.5 top-1.5 flex gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="grid size-7 place-items-center rounded-full bg-white/95 text-slate-600 shadow-sm"
          aria-label={`Editar ${product.name}`}
        >
          <Pencil size={13} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="grid size-7 place-items-center rounded-full bg-white/95 text-slate-600 shadow-sm"
          aria-label={`Excluir ${product.name}`}
        >
          <Trash2 size={13} strokeWidth={2} className="text-red-600" />
        </button>
        </div>
      </div>
    </article>
  )
}

function AdminPortionOptionRow({ option, onEdit, onRemove }) {
  const peopleCount = Math.max(1, Number.parseInt(option.people || option.label, 10) || 1)

  return (
    <article className="grid min-h-[56px] grid-cols-[32px_1fr_auto_auto_auto] items-center gap-1.5 rounded-[8px] border border-[#b7928b] bg-white px-2.5 py-1.5">
      <span
        className="grid w-7 grid-cols-2 place-items-center gap-x-0 gap-y-0.5 text-[#7d5148]"
        aria-label={`${peopleCount} ${peopleCount === 1 ? 'pessoa' : 'pessoas'}`}
      >
        {Array.from({ length: peopleCount }, (_, index) => (
          <UserRound
            key={index}
            size={peopleCount > 4 ? 10 : 13}
            strokeWidth={1.8}
            className={peopleCount % 2 === 1 && index === peopleCount - 1 ? 'col-span-2 justify-self-center' : ''}
          />
        ))}
      </span>
      <div className="min-w-0">
        <h3 className="text-[12px] font-medium">{option.label}</h3>
        <p className="truncate text-[10px] font-medium text-[#9d817a]">{option.detail}</p>
      </div>
      <p className="whitespace-nowrap text-[12px] font-black">{formatCurrency(parseAdminPrice(option.price))}</p>
      <button
        type="button"
        onClick={onEdit}
        className="grid size-8 place-items-center rounded-[7px] border border-[#b7928b] text-[#7d5148]"
        aria-label="Editar porção"
      >
        <Pencil size={17} />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="grid size-8 place-items-center rounded-[7px] border border-[#b7928b] text-[#7d5148]"
        aria-label="Excluir porção"
      >
        <Trash2 size={17} className="text-red-600" />
      </button>
    </article>
  )
}

function AdminAllergenDialog({ selectedTags, onClose, onToggle }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 px-5 backdrop-blur-[1px]">
      <section className="w-full rounded-2xl border border-[#4b160e] bg-white px-4 py-5 text-center shadow-xl">
        <h2 className="text-xl font-black text-[#6b433a]">Alergênicos</h2>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {allergenOptions.map((option) => (
            <button
              type="button"
              key={option.id}
              onClick={() => onToggle(option.id)}
              aria-pressed={selectedTags.includes(option.id)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-base font-semibold ${
                selectedTags.includes(option.id)
                  ? 'border-[#4b160e] bg-white text-[#6b433a]'
                  : 'border-transparent bg-slate-100 text-[#8e8e8e]'
              }`}
            >
              <span className="grid size-8 place-items-center overflow-hidden rounded-full text-[13px]">
                {getAllergenIcon(option.id)}
              </span>
              {option.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mx-auto mt-5 flex h-9 w-32 items-center justify-center rounded-full bg-[#4b160e] text-base font-semibold text-white"
        >
          Salvar
        </button>
      </section>
    </div>
  )
}

function AdminAllergenChip({ label, onRemove }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-[#8b6d66]">
      <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full text-[13px]">{getAllergenIcon(label)}</span>
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="grid size-4 place-items-center rounded-full bg-slate-300 text-[10px] font-black text-white"
        aria-label={`Remover ${label}`}
      >
        x
      </button>
    </span>
  )
}

function AdminConfirmDialog({ title, confirmLabel, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/72 px-8 backdrop-blur-[1px] md:absolute">
      <section className="w-full rounded-2xl border border-[#4b160e] bg-white px-7 py-6 text-center shadow-xl">
        <h2 className="text-lg font-black leading-7 text-[#6b433a]">{title}</h2>
        <div className="mt-5 flex justify-center gap-6">
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 min-w-[112px] rounded bg-[#4b160e] px-5 text-base font-semibold text-white"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-10 min-w-[112px] rounded border border-[#4b160e] px-5 text-base font-semibold text-[#4b160e]"
          >
            Cancelar
          </button>
        </div>
      </section>
    </div>
  )
}

function AdminProductFormModal({ categories, editing, form, onCancel, onChange, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/45 px-4 pb-4 pt-12 md:absolute">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[398px] rounded-2xl bg-white p-4 shadow-2xl shadow-slate-950/20"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              {editing ? 'Editar item' : 'Adicionar item'}
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Atualize nome, categoria, preco e descricao do prato.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-600"
            aria-label="Fechar formulario"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <AdminInput
            label="Nome"
            value={form.name}
            placeholder="Ex.: Camarao Coco Brasil"
            onChange={(value) => onChange((current) => ({ ...current, name: value }))}
          />

          <div className="grid grid-cols-[1fr_104px] gap-3">
            <label className="block text-xs font-black text-slate-600">
              Categoria
              <select
                value={form.category}
                onChange={(event) =>
                  onChange((current) => ({ ...current, category: event.target.value }))
                }
                className="mt-2 h-11 w-full rounded-lg bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none ring-1 ring-slate-200"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <AdminInput
              label="Preco"
              value={form.price}
              placeholder="199,00"
              onChange={(value) => onChange((current) => ({ ...current, price: value }))}
            />
          </div>

          <AdminInput
            label="Ingredientes"
            value={form.ingredients}
            placeholder="Camarao, catupiry, arroz"
            onChange={(value) => onChange((current) => ({ ...current, ingredients: value }))}
          />

          <AdminInput
            label="Descricao"
            value={form.description}
            placeholder="Resumo do item"
            onChange={(value) => onChange((current) => ({ ...current, description: value }))}
          />
        </div>

        <button
          type="submit"
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 text-sm font-black text-white transition active:scale-[0.99]"
        >
          <Save size={17} />
          {editing ? 'SALVAR ALTERACOES' : 'SALVAR ITEM'}
        </button>
      </form>
    </div>
  )
}

function PartnerMetric({ label, value }) {
  return (
    <div className="rounded-lg bg-white/10 p-3">
      <p className="text-lg font-black">{value}</p>
      <p className="mt-1 text-[10px] font-bold text-white/55">{label}</p>
    </div>
  )
}

function SettingsRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm font-bold text-slate-600">{label}</span>
      <span className="text-sm font-black text-slate-950">{value}</span>
    </div>
  )
}

function OrderScreen({
  cartItems,
  cartTotal,
  orderSent,
  restaurantProfile = defaultRestaurantProfile,
  tableNumber,
  onBack,
  onEditCartItem,
  onFinishOrder,
  onSendOrder,
  onTableChange,
  onUpdateCartItem,
}) {
  const [customerName, setCustomerName] = useState('')
  const [serviceType, setServiceType] = useState('mesa')
  const [observations, setObservations] = useState('')

  return (
    <section className="h-full overflow-y-auto overflow-x-hidden bg-white pb-8 text-[#4b160e]">
      <TopPhotoBar backgroundImage={restaurantProfile.cover} onBack={onBack} onOpenSettings={() => {}} compact />

      <div className="relative z-10 -mt-9 rounded-t-[24px] bg-white px-5 pb-8 pt-7 shadow-[0_-14px_34px_rgba(67,22,15,0.10)]">
        {orderSent ? (
          <section aria-labelledby="confirmed-order-title">
            <div className="flex items-center gap-3 px-2">
              <div className="grid size-12 place-items-center rounded-full bg-[#4b160e] text-white">
                <CircleCheck size={24} />
              </div>
              <div>
                <h1 id="confirmed-order-title" className="text-[16px] font-bold">RESUMO DO PEDIDO</h1>
                <p className="text-[11px] font-normal text-[#79574f]">Confira os itens com o garçom</p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {cartItems.map((item) => {
                const unitPrice = item.unitPrice ?? item.product.price
                const itemTotal = unitPrice * item.quantity

                return (
                  <article key={`${item.productId}-${item.optionId}-${item.note}`} className="grid grid-cols-[72px_1fr_auto] items-center gap-3 rounded-lg border border-[#d8c7bf] bg-white p-2.5">
                    <img src={item.product.image} alt="" className="size-[72px] rounded-md object-cover" aria-hidden="true" />
                    <div className="min-w-0">
                      <h2 className="truncate text-[12px] font-bold" title={item.product.name}>{item.product.name.toUpperCase()}</h2>
                      <p className="mt-1 text-[11px] font-normal text-[#79574f]">Quantidade: {item.quantity}</p>
                      <p className="mt-0.5 text-[11px] font-normal text-[#79574f]">Unitário: {formatCurrency(unitPrice)}</p>
                      {item.note && <p className="mt-0.5 line-clamp-2 text-[9px] font-normal leading-3 text-[#8b6d66]">Obs.: {item.note}</p>}
                    </div>
                    <p className="text-right text-[13px] font-bold">{formatCurrency(itemTotal)}</p>
                  </article>
                )
              })}
            </div>

            <div className="mt-4 flex h-12 items-center justify-between rounded-lg border border-[#8d5a4e] bg-[#f2e3cc] px-4">
              <span className="text-[14px] font-bold">TOTAL DO PEDIDO</span>
              <strong className="text-[17px]">{formatCurrency(cartTotal)}</strong>
            </div>

            <button
              type="button"
              onClick={onFinishOrder}
              className="mx-auto mt-5 flex h-11 w-[86%] items-center justify-center rounded-full bg-[#4b160e] text-[13px] font-medium text-white transition active:scale-[0.99]"
            >
              PEDIDO FEITO AO GARÇOM
            </button>
          </section>
        ) : (
          <>
            <div className="flex items-center gap-3 px-2">
              <span className="grid size-12 place-items-center rounded-full bg-[#4b160e] text-white">
                <ReceiptText size={23} />
              </span>
              <div>
                <h1 data-screen-title="true" tabIndex={-1} className="text-[16px] font-bold outline-none">
                  SEU PEDIDO
                </h1>
                <p className="text-[11px] font-normal">Confirme os itens do seu pedido</p>
              </div>
            </div>

            <section className="mt-4 space-y-2.5">
              {cartItems.length === 0 ? (
                <p className="rounded-lg border border-[#eadfd9] bg-white p-4 text-sm font-bold text-[#9b837a]">
                  Nenhum item adicionado.
                </p>
              ) : (
                cartItems.map((item) => (
                  <OrderItemCard
                    key={`${item.productId}-${item.optionId}-${item.note}`}
                    item={item}
                    onEdit={() => onEditCartItem(item)}
                    onUpdateCartItem={onUpdateCartItem}
                  />
                ))
              )}
            </section>

            <section className="mt-7">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-[#4b160e] text-white">
                  <ReceiptText size={17} />
                </span>
                <h2 className="text-[15px] font-bold">Observações</h2>
              </div>
              <textarea
                value={observations}
                onChange={(event) => setObservations(event.target.value)}
                placeholder="Ex.: Caldinho de peixe sem azeitona"
                className="mt-3 h-[68px] w-full resize-none rounded-lg border border-[#d8c7bf] px-4 py-3 text-[12px] font-normal text-[#4b160e] outline-none placeholder:text-[#b6a4a0]"
              />
            </section>

            <div className="mt-3">
              <div className="flex h-12 items-center justify-between gap-3 rounded-lg border border-[#8d5a4e] bg-[#f2e3cc] px-4">
                <span className="flex items-center gap-2.5 text-[14px] font-bold">
                  <ShoppingCart size={19} />
                  TOTAL
                </span>
                <p className="text-[17px] font-bold">{formatCurrency(cartTotal)}</p>
              </div>
              <button
                type="button"
                onClick={() => onSendOrder({ customerName, serviceType, paymentType: 'garcom', observations })}
                disabled={!cartItems.length}
                className="mx-auto mt-3 flex h-11 w-[82%] items-center justify-center rounded-full bg-[#4b160e] text-[13px] font-medium text-white transition active:scale-[0.99] disabled:bg-[#b89d94] disabled:text-white/65"
              >
                MOSTRAR AO GARÇOM
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function OrderItemCard({ item, onEdit, onUpdateCartItem }) {
  const itemPrice = (item.unitPrice ?? item.product.price) * item.quantity
  const detail = item.optionLabel || item.optionDetail || 'Porção'

  return (
    <article className="grid min-h-[108px] grid-cols-[124px_1fr] gap-2.5 rounded-lg border border-[#d8c7bf] bg-white p-2">
      <img
        src={item.product.image}
        alt=""
        aria-hidden="true"
        className="h-[92px] w-full rounded-md object-cover"
      />
      <div className="relative min-w-0 py-1">
        <h2 className="truncate pr-8 text-[13px] font-bold" title={item.product.name}>
          {item.product.name.toUpperCase()}
        </h2>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Editar porção e observações de ${item.product.name}`}
          className="absolute right-0 top-0 grid size-7 place-items-center rounded-full bg-[#f4ece8] text-[#79574f]"
        >
          <Pencil size={13} strokeWidth={1.8} />
        </button>
        <p className="mt-1 flex items-center gap-1 text-[11px] font-normal text-[#79574f]">
          <UserRound size={13} strokeWidth={1.5} />
          {detail}
        </p>
        {item.note && (
          <p className="mt-1 line-clamp-2 text-[10px] font-normal leading-3 text-[#8b6d66]">Obs.: {item.note}</p>
        )}
        <div className="absolute bottom-0 left-0 inline-flex h-6 items-center rounded-full border border-[#8d5a4e] bg-[#f7ead7] text-[#4b160e]">
          <button
            type="button"
            onClick={() => onUpdateCartItem(item.productId, item.quantity - 1, item.optionId, item.note)}
            aria-label={`Diminuir quantidade de ${item.product.name}`}
            className="grid h-6 w-8 place-items-center"
          >
            <Minus size={14} strokeWidth={3} />
          </button>
          <span className="w-8 text-center text-[12px] font-semibold">{item.quantity}</span>
          <button
            type="button"
            onClick={() => onUpdateCartItem(item.productId, item.quantity + 1, item.optionId, item.note)}
            aria-label={`Aumentar quantidade de ${item.product.name}`}
            className="grid h-6 w-8 place-items-center"
          >
            <Plus size={14} strokeWidth={3} />
          </button>
        </div>
        <p className="absolute bottom-1 right-0 text-right text-[13px] font-bold">{formatCurrency(itemPrice)}</p>
      </div>
    </article>
  )
}

function CartBar({ quantity, total, onOpenOrder }) {
  return (
    <div className="fixed bottom-4 left-1/2 z-[120] w-[calc(100%-32px)] max-w-[398px] -translate-x-1/2 rounded-2xl border border-[#e2d7d2] bg-white/95 px-3 py-2 text-[#4b160e] shadow-[0_10px_30px_rgba(67,22,15,0.16)] backdrop-blur">
      <button
        type="button"
        onClick={onOpenOrder}
        aria-label={`Fazer pedido com ${quantity} ${quantity === 1 ? 'item' : 'itens'}, total de ${formatCurrency(total)}`}
        className="flex h-11 w-full items-center justify-between gap-3"
      >
        <span className="flex items-center gap-2.5">
          <span className="relative grid size-9 place-items-center rounded-full bg-[#f4ece8]">
            <ShoppingCart size={17} strokeWidth={1.8} />
            <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#d8ad61] text-[9px] font-semibold text-white">
              {quantity}
            </span>
          </span>
          <span className="text-left">
            <span className="block text-[11px] font-normal text-[#8b6d66]">
              {quantity} {quantity === 1 ? 'item' : 'itens'}
            </span>
            <span className="block text-[14px] font-semibold">{formatCurrency(total)}</span>
          </span>
        </span>
        <span className="inline-flex h-8 items-center rounded-full bg-[#4b160e] px-4 text-[11px] font-medium text-white">
          Ver carrinho
        </span>
      </button>
    </div>
  )
}
function HeaderBar({ title, onBack }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-100 bg-white/95 px-4 backdrop-blur">
      <button
        type="button"
        onClick={onBack}
        aria-label="Voltar"
        className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-900 transition active:scale-95"
      >
        <ArrowLeft size={21} strokeWidth={2.7} />
      </button>
      <h1 data-screen-title="true" tabIndex={-1} className="text-lg font-black text-slate-900 outline-none">
        {title}
      </h1>
    </header>
  )
}

function AdminInput({ label, value, placeholder, onChange }) {
  return (
    <label className="block text-xs font-black text-slate-600">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-lg bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none ring-1 ring-slate-200 placeholder:text-slate-400"
      />
    </label>
  )
}

function cancelSpeechQueue() {
  if (
    typeof window === 'undefined' ||
    !window.speechSynthesis
  ) {
    return
  }

  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume()
  }

  window.speechSynthesis.cancel()
}

function getAnalyticsSession(tableNumber) {
  const storedSession = window.sessionStorage?.getItem(sessionStorageKey)

  if (storedSession) {
    try {
      return JSON.parse(storedSession)
    } catch {
      window.sessionStorage?.removeItem(sessionStorageKey)
    }
  }

  const source = getSourceFromUrl()
  const session = {
    id: crypto.randomUUID(),
    restaurantId,
    cardId: tableNumber ? `mesa_${tableNumber}` : source,
    source,
    startedAt: new Date().toISOString(),
    language: 'pt-BR',
  }

  window.sessionStorage?.setItem(sessionStorageKey, JSON.stringify(session))
  return session
}

function getSourceFromUrl() {
  const params = new URLSearchParams(window.location.search)

  if (params.has('mesa')) return 'nfc'
  if (params.get('source')) return params.get('source')

  return 'direct'
}

function readAnalyticsEvents() {
  try {
    return JSON.parse(window.localStorage?.getItem(analyticsStorageKey) ?? '[]')
  } catch {
    return []
  }
}

function saveAnalyticsEvents(events) {
  window.localStorage?.setItem(analyticsStorageKey, JSON.stringify(events))
}

function buildAnalyticsEvent(eventName, session, payload = {}) {
  return {
    id: crypto.randomUUID(),
    event: eventName,
    restaurantId: session.restaurantId || restaurantId,
    sessionId: session.id,
    cardId: session.cardId,
    source: session.source,
    createdAt: new Date().toISOString(),
    ...payload,
  }
}

function buildOrderRecord({ analyticsSession, cartItems, cartTotal, orderData, tableNumber }) {
  return {
    id: crypto.randomUUID(),
    restaurantId: analyticsSession.restaurantId || restaurantId,
    sessionId: analyticsSession.id,
    tableNumber: tableNumber || '',
    serviceType: orderData.serviceType ?? 'mesa',
    paymentType: orderData.paymentType ?? 'caixa',
    customerName: orderData.customerName?.trim() || '',
    observations: orderData.observations?.trim() || '',
    status: 'received',
    cartQuantity: cartItems.reduce((total, item) => total + item.quantity, 0),
    cartTotal,
    clientCreatedAt: new Date().toISOString(),
    items: cartItems.map((item) => {
      const unitPrice = item.unitPrice ?? item.product.price

      return {
        productId: item.productId,
        name: item.product.name,
        optionId: item.optionId,
        optionLabel: item.optionLabel,
        optionDetail: item.optionDetail,
        people: item.people,
        quantity: item.quantity,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
        note: item.note,
      }
    }),
  }
}

function buildAnalyticsSummary(events, products, session) {
  const eventCount = (eventName) => events.filter((event) => event.event === eventName).length
  const menuOpens = Math.max(eventCount('menu_open'), 1)
  const vezzClicks = eventCount('vezz_click')
  const orderEvents = events.filter((event) => event.event === 'order_sent')
  const hourlyCounts = Array.from({ length: 6 }, (_, index) => {
    const hour = 18 + index
    const count = events.filter((event) => {
      const eventHour = new Date(event.createdAt).getHours()
      return eventHour === hour
    }).length

    return { hour, count }
  })
  const maxHourlyCount = Math.max(...hourlyCounts.map((item) => item.count), 1)

  return {
    menuOpens,
    vezzClicks,
    uniqueSessions: new Set(events.map((event) => event.sessionId)).size || 1,
    productViews: eventCount('product_view'),
    productAdds: eventCount('product_add'),
    activeProducts: products.filter((product) => product.active !== false).length,
    totalProducts: products.length,
    ordersSent: orderEvents.length,
    averageTicket: orderEvents.length
      ? orderEvents.reduce((total, event) => total + Number(event.cartTotal ?? 0), 0) / orderEvents.length
      : 0,
    cardId: session.cardId,
    source: session.source,
    vezzCtr: ((vezzClicks / menuOpens) * 100).toFixed(1).replace('.', ','),
    hourlyDemand: hourlyCounts.map((item) => ({
      ...item,
      width: Math.max(8, Math.round((item.count / maxHourlyCount) * 100)),
    })),
  }
}

function searchProducts(products, query) {
  const normalizedQuery = normalizeText(query)

  if (!normalizedQuery) {
    return { items: products, mode: 'all' }
  }

  const withoutMatch = normalizedQuery.match(/\bsem\s+(.+)/)

  if (withoutMatch) {
    const blockedTerms = withoutMatch[1].split(/\s+/).filter(Boolean)

    const filteredItems = products.filter((product) => {
      const searchable = getProductSearchProfile(product).full
      return blockedTerms.every((term) => !searchable.includes(term))
    })

    return { items: filteredItems, mode: filteredItems.length ? 'direct' : 'none' }
  }

  const terms = getSearchTerms(normalizedQuery)

  if (!terms.length) {
    return { items: products, mode: 'all' }
  }

  const directMatches = products.filter((product) => {
    const searchable = getProductSearchProfile(product).full
    return terms.every((term) => searchable.includes(term))
  })

  if (directMatches.length) {
    return { items: directMatches, mode: 'direct' }
  }

  const similarMatches = products
    .map((product) => ({ product, score: getProductSimilarityScore(product, terms) }))
    .filter(({ score }) => score > 0)
    .sort((firstItem, secondItem) => secondItem.score - firstItem.score)
    .map(({ product }) => product)

  return {
    items: similarMatches,
    mode: similarMatches.length ? 'similar' : 'none',
  }
}

function getSearchTerms(normalizedQuery) {
  const ignoredTerms = new Set([
    'a',
    'as',
    'ao',
    'aos',
    'com',
    'da',
    'das',
    'de',
    'do',
    'dos',
    'e',
    'em',
    'na',
    'nas',
    'no',
    'nos',
    'o',
    'os',
    'para',
    'por',
    'prato',
    'pratos',
    'quero',
    'um',
    'uma',
    'ver',
  ])

  return normalizedQuery
    .split(/\s+/)
    .filter((term) => (term.length > 1 || /\d/.test(term)) && !ignoredTerms.has(term))
}

function getProductSearchProfile(product) {
  const category = categories.find((item) => item.id === product.category)
  const optionText = (product.options ?? [])
    .map((option) => `${option.label ?? ''} ${option.detail ?? ''} ${option.people ?? ''} pessoas ${option.price ?? ''}`)
    .join(' ')
  const tags = product.tags ?? []
  const name = normalizeText(product.name)
  const categoryText = normalizeText(`${category?.label ?? ''} ${category?.shortLabel ?? ''} ${product.category}`)
  const tagText = normalizeText(tags.join(' '))
  const details = normalizeText(`${product.description ?? ''} ${product.voiceDescription ?? ''} ${product.badge ?? ''} ${optionText}`)
  const full = normalizeText(`${name} ${categoryText} ${tagText} ${details}`)

  return {
    name,
    category: categoryText,
    tags: tagText,
    details,
    full,
    tokens: full.split(/\s+/),
  }
}

function getProductSimilarityScore(product, terms) {
  const profile = getProductSearchProfile(product)

  return terms.reduce((score, term) => {
    let nextScore = score

    if (profile.name.includes(term)) nextScore += 10
    if (profile.tags.includes(term)) nextScore += 8
    if (profile.category.includes(term)) nextScore += 7
    if (profile.details.includes(term)) nextScore += 4
    if (term.length > 3 && profile.tokens.some((token) => token.length > 3 && (token.startsWith(term) || term.startsWith(token)))) {
      nextScore += 2
    }

    return nextScore
  }, 0)
}

function findProductByCommand(products, command) {
  return products.find((product) => {
    const productName = normalizeText(product.name)
    const productTerms = productName.split(/\s+/).filter((term) => term.length > 2)

    return command.includes(productName) || productTerms.every((term) => command.includes(term))
  })
}

function groupProductsByMenuSection(products, category) {
  const groups = products.reduce((currentGroups, product) => {
    const title = getProductMenuSection(product, category)

    if (!currentGroups.has(title)) {
      currentGroups.set(title, [])
    }

    currentGroups.get(title).push(product)
    return currentGroups
  }, new Map())

  return Array.from(groups, ([title, groupProducts]) => ({
    title,
    products: groupProducts,
  }))
}

function getProductMenuSection(product, category) {
  const productName = normalizeText(product.name)

  if (category.id === 'frutos-do-mar') {
    if (productName.includes('camarao')) return 'CAMARÃO'
    if (productName.includes('lagosta')) return 'LAGOSTA'
    if (productName.includes('peixe') || productName.includes('caldinho')) return 'PEIXES'
  }

  if (category.id === 'carnes') return 'CARNES'
  if (category.id === 'entradas') return 'ENTRADAS'
  if (category.id === 'saladas') return 'SALADAS'
  if (category.id === 'frangos') return 'FRANGOS'
  if (category.id === 'veganos') return 'VEGANOS'
  if (category.id === 'sobremesas') return 'SOBREMESAS'
  if (category.id === 'bebidas') return 'BEBIDAS'

  return category.label.toUpperCase()
}

function normalizeText(value) {
  return String(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{Letter}\p{Number}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function slugifyMenuName(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'cardapio'
}

function getPublicMenuHash(slugOrName = defaultRestaurantProfile.slug) {
  return `cardapio-${slugifyMenuName(slugOrName)}`
}

function getAdminPrincipalHash() {
  return 'admin-principal'
}

function buildPublicMenuUrl(slugOrName = defaultRestaurantProfile.slug) {
  const url = new URL(window.location.href)

  url.hash = getPublicMenuHash(slugOrName)
  return url.toString()
}

function serializeImageSource(value) {
  const key = getAppAssetKey(value)
  return key ? `app-asset:${key}` : value
}

function hydrateImageSource(value, fallback) {
  const source = typeof value === 'string' ? value.trim() : ''
  const key = getAppAssetKey(source)

  if (key) return appAssetRegistry[key].src
  if (!source || isLegacyDevelopmentAsset(source) || isBundledAppAssetPath(source)) return fallback
  return source
}

function getAppAssetKey(value) {
  const source = typeof value === 'string' ? value.trim() : ''
  if (!source) return ''

  const directKey = appAssetUrlToKey.get(source)
  if (directKey) return directKey

  if (source.startsWith('app-asset:')) {
    const assetKey = source.slice('app-asset:'.length)
    return appAssetRegistry[assetKey] ? assetKey : ''
  }

  const fingerprint = normalizeAssetFingerprint(source)
  if (!isAppAssetReference(fingerprint)) return ''

  return Object.entries(appAssetRegistry).find(([, asset]) =>
    asset.tokens.some((token) => fingerprint.includes(token)),
  )?.[0] ?? ''
}

function normalizeAssetFingerprint(value) {
  try {
    return decodeURIComponent(value).replace(/\\/g, '/').toLowerCase()
  } catch {
    return String(value).replace(/\\/g, '/').toLowerCase()
  }
}

function isAppAssetReference(value) {
  return value.startsWith('assets/') || value.includes('/assets/') || value.includes('/src/assets/') || value.includes('src/assets/')
}

function isBundledAppAssetPath(value) {
  const fingerprint = normalizeAssetFingerprint(value)
  return fingerprint.startsWith('/assets/') || fingerprint.startsWith('assets/')
}

function serializeRestaurantProfile(profile) {
  return {
    ...profile,
    logo: serializeImageSource(profile.logo),
    cover: serializeImageSource(profile.cover),
  }
}

function normalizeRestaurantProfile(profile = defaultRestaurantProfile) {
  const logo = hydrateImageSource(profile.logo, defaultRestaurantProfile.logo)
  const cover = hydrateImageSource(profile.cover, defaultRestaurantProfile.cover)

  return {
    ...defaultRestaurantProfile,
    ...profile,
    logo: logo || defaultRestaurantProfile.logo,
    cover: cover || defaultRestaurantProfile.cover,
    slug: slugifyMenuName(profile.slug || profile.name || defaultRestaurantProfile.slug),
    theme: {
      ...defaultRestaurantProfile.theme,
      ...(profile.theme ?? {}),
    },
  }
}

function buildThemeStyle(profile = defaultRestaurantProfile) {
  const theme = normalizeRestaurantProfile(profile).theme

  return {
    '--brand-primary': theme.primary,
    '--brand-accent': theme.accent,
    '--brand-surface': '#ffffff',
    accentColor: theme.primary,
  }
}

function buildMenuStateSnapshot(profile = defaultRestaurantProfile, promoItems = promoSlides, products = baseProducts, categoryItems = categories) {
  const normalizedProfile = normalizeRestaurantProfile(profile)

  return {
    version: 1,
    profile: serializeRestaurantProfile(normalizedProfile),
    categories: serializeCategories(categoryItems),
    promoItems: serializePromoItems(promoItems),
    products: serializeProducts(products),
  }
}

function normalizeMenuStateSnapshot(menuState, fallbackSlug = defaultRestaurantProfile.slug) {
  const profile = normalizeRestaurantProfile({
    ...defaultRestaurantProfile,
    ...(menuState?.profile ?? menuState?.restaurantProfile ?? {}),
    slug: fallbackSlug || menuState?.profile?.slug || menuState?.restaurantProfile?.slug || defaultRestaurantProfile.slug,
  })

  return {
    profile,
    categories: hydrateCategories(menuState?.categories),
    promoItems: hydratePromoItems(menuState?.promoItems),
    products: hydrateProducts(menuState?.products),
  }
}

function serializeCategories(items = categories) {
  return items.map((item) => ({
    ...item,
    iconImage: serializeImageSource(item.iconImage),
    image: serializeImageSource(item.image),
  }))
}

function hydrateCategories(items) {
  if (!Array.isArray(items) || !items.length) return categories

  return items.map((item) => {
    const baseCategory = categories.find((category) => category.id === item.id)

    return {
      ...(baseCategory ?? {}),
      ...item,
      label: item.label || baseCategory?.label || 'Categoria',
      shortLabel: item.shortLabel || item.label || baseCategory?.shortLabel || 'Categoria',
      iconImage: hydrateImageSource(item.iconImage, baseCategory?.iconImage || iconEntradas),
      image: hydrateImageSource(item.image, baseCategory?.image || categoriaEntradas),
    }
  })
}

function serializePromoItems(items = promoSlides) {
  return items.map((item) => ({
    ...item,
    image: serializeImageSource(item.image),
  }))
}

function serializeProducts(items = baseProducts) {
  return items.map((item) => {
    const serializableItem = { ...item }

    delete serializableItem.badgeIcon
    serializableItem.image = serializeImageSource(serializableItem.image)

    return serializableItem
  })
}

function hydratePromoItems(items) {
  if (!Array.isArray(items) || !items.length) return promoSlides

  return items.map((item) => {
    const basePromo = promoSlides.find((promo) => promo.id === item.id)

    return {
      ...(basePromo ?? {}),
      ...item,
      image: hydrateImageSource(item.image, basePromo?.image || promoShrimp),
    }
  })
}

function hydrateProducts(items) {
  if (!Array.isArray(items) || !items.length) return baseProducts

  return items.map((item) => {
    const baseProduct = baseProducts.find((product) => product.id === item.id)
    const category = item.category ?? baseProduct?.category ?? 'frutos-do-mar'

    return {
      ...(baseProduct ?? {}),
      ...item,
      category,
      image: hydrateImageSource(item.image, baseProduct?.image || fallbackImages[category] || categoriaFrutosDoMar),
      tags: Array.isArray(item.tags) ? item.tags : baseProduct?.tags ?? [],
      options: Array.isArray(item.options) ? item.options : baseProduct?.options ?? [],
      active: item.active !== false,
    }
  })
}

function isLegacyDevelopmentAsset(value) {
  return typeof value === 'string' && (value.startsWith('/src/assets/') || value.startsWith('src/assets/'))
}

function getTableFromUrl() {
  return new URLSearchParams(window.location.search).get('mesa') ?? ''
}

function syncAppViewportHeight() {
  if (typeof window === 'undefined') return

  const viewportHeight = window.visualViewport?.height || window.innerHeight
  if (!viewportHeight) return

  document.documentElement.style.setProperty('--app-viewport-height', `${Math.round(viewportHeight)}px`)
}

function getMenuSlugFromHash(hashValue = window.location.hash) {
  const hash = String(hashValue ?? '')

  if (hash.startsWith('#cardapio-')) return slugifyMenuName(hash.replace('#cardapio-', ''))
  if (hash.startsWith('#menu=')) return slugifyMenuName(hash.replace('#menu=', ''))

  return ''
}

function isCustomMenuSlug(slug) {
  return Boolean(slug) && slug !== defaultRestaurantProfile.slug
}

function shouldBlockCustomMenuPaint(slug, cachedState) {
  return isCustomMenuSlug(slug) && !cachedState
}

function isPublicMenuScreen(screen) {
  return ['menu', 'categorias', 'categoria-pratos', 'produto', 'promocao', 'pedido'].includes(screen)
}

function getInitialScreen() {
  const hash = window.location.hash

  if (hash.startsWith('#produto=')) return 'produto'
  if (hash.startsWith('#promocao=')) return 'promocao'
  if (hash.startsWith('#categoria=')) return 'categoria-pratos'
  if (hash.startsWith('#cardapio-')) return 'menu'
  if (hash.startsWith('#menu=')) return 'menu'
  if (hash === '#pedido') return 'pedido'
  if (hash === '#menu') return 'menu'
  if (hash === '#categorias') return 'categorias'
  if (hash.startsWith('#cadastro-administrador')) return 'cadastro-administrador'
  if (hash.startsWith(`#${getAdminPrincipalHash()}`)) return 'admin-cardapio'
  if (hash.startsWith('#configuracoes')) return 'configuracoes'
  if (hash.startsWith('#admin-cardapio')) return 'admin-cardapio'

  return 'menu'
}

function getCategoryFromHash() {
  const categoryId = window.location.hash.replace('#categoria=', '')

  return categories.some((category) => category.id === categoryId)
    ? categoryId
    : ''
}

function getPromoFromHash() {
  return window.location.hash.replace('#promocao=', '')
}

function getInitialAdminTab() {
  const tab = new URLSearchParams(window.location.search).get('adminTab')
  const validTabs = ['cardapio', 'mesas', 'vezz', 'cartao']

  return validTabs.includes(tab) ? tab : 'cardapio'
}

function getProductFromHash() {
  const productId = window.location.hash.replace('#produto=', '')
  return baseProducts.some((product) => product.id === productId)
    ? productId
    : baseProducts[0].id
}

function buildNfcUrl(tableNumber, slug = defaultRestaurantProfile.slug) {
  const url = new URL(window.location.href)
  url.searchParams.set('mesa', tableNumber)
  url.hash = getPublicMenuHash(slug)
  return url.toString()
}

function buildDishInfoTags(product) {
  const recognizedAllergens = new Set(allergenOptions.map((allergen) => normalizeText(allergen.id)))
  const tags = (product.tags ?? []).filter((tag) => recognizedAllergens.has(normalizeText(tag)))

  return tags
}

function buildProductAriaLabel(product) {
  return `${product.name}. ${formatCurrency(product.price)}. Ingredientes principais: ${product.tags.join(', ')}. Abrir detalhes.`
}

function buildProductSpeech(product) {
  const intro = `Descrição acessível de ${product.name}. Preço: ${formatCurrency(product.price)}.`
  const description = product.voiceDescription ?? buildFallbackProductSpeech(product)

  return `${intro} ${description}`
}

function buildFallbackProductSpeech(product) {
  const ingredients = product.tags.join(', ')
  const category = categories.find((item) => item.id === product.category)?.label ?? 'item'

  return [
    `Este item da categoria ${category.toLowerCase()} foi cadastrado pelo restaurante com os ingredientes: ${ingredients}.`,
    `A descrição do cardápio informa: ${product.description}.`,
    'Ao imaginar o prato, pense primeiro na base, depois no recheio principal, nos acompanhamentos e por fim no molho ou acabamento que dá aroma e umidade.',
  ].join(' ')
}

function prepareSpeechText(text) {
  return text
    .replace(/\bbacon\b/gi, 'beicon')
    .replace(/(\d+)\s*g\b/gi, '$1 gramas')
    .replace(/(\d+)\s*ml\b/gi, '$1 mililitros')
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export default App
