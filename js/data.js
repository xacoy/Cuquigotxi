'use strict';
/* Catálogos: objetos, tienda, trabajos, amigos, rasgos y logros. */

const FOODS = {
  manzana:  { name: 'Manzana',        price: 3,  kind: 'meal',  hunger: 1, weight: 0 },
  sopa:     { name: 'Sopa caliente',  price: 6,  kind: 'meal',  hunger: 2, weight: 1 },
  burger:   { name: 'Hamburguesa',    price: 8,  kind: 'meal',  hunger: 3, weight: 3 },
  helado:   { name: 'Helado',         price: 5,  kind: 'snack', happy: 2,  weight: 2 },
  tarta:    { name: 'Tarta',          price: 10, kind: 'snack', happy: 3,  weight: 3 },
  vitamina: { name: 'Vitamina',       price: 12, kind: 'drug',  health: 1 },
  jarabe:   { name: 'Jarabe milagro', price: 15, kind: 'drug',  cure: true },
};
const TOYS = {
  pelota:   { name: 'Pelota',    price: 15, happy: 1, bond: 2 },
  peluche:  { name: 'Peluche',   price: 25, happy: 1, bond: 4 },
  cometa:   { name: 'Cometa',    price: 20, happy: 2, bond: 2 },
  guitarra: { name: 'Guitarra',  price: 30, happy: 2, bond: 3 },
};
const ACCESSORIES = {
  lazo:     { name: 'Lazo',            slot: 'head', price: 10 },
  corona:   { name: 'Corona',          slot: 'head', price: 40 },
  copa:     { name: 'Sombrero de copa', slot: 'head', price: 25 },
  gorro:    { name: 'Gorro de fiesta', slot: 'head', price: 15 },
  gorra:    { name: 'Gorra',           slot: 'head', price: 15 },
  gafas:    { name: 'Gafas de sol',    slot: 'face', price: 12 },
  corazones:{ name: 'Gafas corazón',   slot: 'face', price: 15 },
  bigote:   { name: 'Bigote',          slot: 'face', price: 10 },
  bufanda:  { name: 'Bufanda',         slot: 'neck', price: 14 },
  pajarita: { name: 'Pajarita',        slot: 'neck', price: 12 },
  medalla:  { name: 'Medalla',         slot: 'neck', price: 18 },
};
const WALLPAPERS = {
  meadow: { name: 'Pradera',   price: 0 },
  beach:  { name: 'Playa',     price: 30 },
  space:  { name: 'Espacio',   price: 40 },
  candy:  { name: 'Dulcelandia', price: 35 },
  forest: { name: 'Bosque',    price: 30 },
  city:   { name: 'Ciudad',    price: 40 },
};
const JOBS = {
  cafe:    { name: 'Cafetería',   secs: 90,  pay: 8,  hunger: 0, desc: '1,5 min · 8 monedas' },
  granja:  { name: 'Granja',      secs: 300, pay: 28, hunger: 1, desc: '5 min · 28 monedas' },
  detective: { name: 'Detective', secs: 900, pay: 85, hunger: 2, desc: '15 min · 85 monedas' },
};
const FRIENDS = [
  { id: 'moko', name: 'Moko', species: 'bunbun', line: '¡Vamos a saltar!' },
  { id: 'kira', name: 'Kira', species: 'kitto', line: 'Miau… digo, ¡hola!' },
  { id: 'sol',  name: 'Sol',  species: 'lumi', line: '¡Brillemos juntos!' },
  { id: 'nube', name: 'Nube', species: 'nimbo', line: 'Hoy flotaba por aquí…' },
  { id: 'rex',  name: 'Rex',  species: 'pinchi', line: '¡Que no pinchan, de verdad!' },
  { id: 'lola', name: 'Lola', species: 'diva', line: '¡Soy la mejor, claro!' },
];
const TRAITS = {
  glotón:    { desc: 'Come mucho: le da hambre antes' },
  juguetón:  { desc: 'Necesita jugar a menudo' },
  tranquilo: { desc: 'Se aburre más despacio' },
  travieso:  { desc: 'Hace más falsas alarmas' },
  sociable:  { desc: 'Adora a sus amigos' },
};
const ACHIEVEMENTS = [
  { id: 'nace',     name: 'Primer huevo',      desc: 'Haz eclosionar un huevo',      coins: 5,  test: q => q.c.births >= 1 },
  { id: 'gourmet',  name: 'Gourmet',           desc: 'Da de comer 20 veces',          coins: 15, test: q => q.c.meals >= 20 },
  { id: 'goloso',   name: 'Goloso',            desc: 'Da 10 dulces',                  coins: 10, test: q => q.c.snacks >= 10 },
  { id: 'ganador',  name: 'Ganador',           desc: 'Gana 10 minijuegos',            coins: 20, test: q => q.c.wins >= 10 },
  { id: 'campeon',  name: 'Campeón',           desc: 'Gana 50 minijuegos',            coins: 60, test: q => q.c.wins >= 50 },
  { id: 'ahorro',   name: 'Ahorrador',         desc: 'Ten 100 monedas a la vez',      coins: 10, test: q => q.p.coins >= 100 },
  { id: 'rico',     name: 'Rico',              desc: 'Ten 500 monedas a la vez',      coins: 50, test: q => q.p.coins >= 500 },
  { id: 'compras',  name: 'De compras',        desc: 'Compra 10 objetos',             coins: 15, test: q => q.c.buys >= 10 },
  { id: 'fashion',  name: 'Fashionista',       desc: 'Ponle un accesorio',            coins: 10, test: q => q.c.equips >= 1 },
  { id: 'deco',     name: 'Decorador',         desc: 'Compra un fondo',               coins: 15, test: q => Object.keys(q.p.owned).some(k => WALLPAPERS[k] && k !== 'meadow') },
  { id: 'atleta',   name: 'Atleta',            desc: 'Entrena 10 veces',              coins: 20, test: q => q.c.trains >= 10 },
  { id: 'currante', name: 'Currante',          desc: 'Completa 5 trabajos',           coins: 25, test: q => q.c.jobs >= 5 },
  { id: 'social',   name: 'Sociable',          desc: 'Visita a tus amigos 5 veces',   coins: 20, test: q => q.c.visits >= 5 },
  { id: 'doctor',   name: 'Doctor',            desc: 'Cura 3 enfermedades',           coins: 20, test: q => q.c.cures >= 3 },
  { id: 'limpio',   name: 'Limpio y fresco',   desc: 'Limpia o baña 10 veces',        coins: 15, test: q => q.c.cleans >= 10 },
  { id: 'foto',     name: 'Fotógrafo',         desc: 'Haz una foto',                  coins: 5,  test: q => q.c.photos >= 1 },
  { id: 'caricias', name: 'Cariñoso',          desc: 'Acaricia 20 veces',             coins: 15, test: q => q.c.pets >= 20 },
  { id: 'coleccion',name: 'Coleccionista',     desc: 'Descubre 5 criaturas',          coins: 25, test: q => Object.keys(q.p.album).length >= 5 },
  { id: 'completo', name: 'Completista',       desc: 'Descubre las 13 criaturas',     coins: 150, test: q => Object.keys(q.p.album).length >= 13 },
  { id: 'cosmico',  name: 'Cuidado perfecto',  desc: 'Consigue a Cósmico',            coins: 100, test: q => !!q.p.album.cosmico },
  { id: 'longevo',  name: 'Longevo',           desc: 'Una mascota vive 10 días',      coins: 40, test: q => q.c.maxDays >= 10 },
];
const ALBUM_ORDER = ['puchi', 'bunbun', 'kitto', 'lumi', 'nimbo', 'pinchi', 'estrellin', 'nubi', 'grunon', 'cosmico', 'fortachon', 'sabio', 'diva'];
