import { Controller, Get, NotFoundException, Param } from "@nestjs/common";

const businesses = [
  {
    id: "almeirim-tasca-bronze",
    name: "A Tasca do Bronze",
    category: "Comer",
    kind: "Restaurante",
    city: "Almeirim",
    address: "Rua de Coruche, 141, 2080-094 Almeirim",
    source: "almeirim.city + OpenStreetMap",
    latitude: 39.2028305,
    longitude: -8.6281241,
  },
  {
    id: "fazendas-a-adega",
    name: "A Adega",
    category: "Comer",
    kind: "Restaurante",
    city: "Fazendas de Almeirim",
    address: "2080-562 Fazendas de Almeirim",
    source: "almeirim.city",
    latitude: 39.1767872,
    longitude: -8.5833777,
  },
  {
    id: "fazendas-novo-conceito",
    name: "Adega Novo Conceito",
    category: "Comer",
    kind: "Adega",
    city: "Fazendas de Almeirim",
    address: "Rua João de Deus, 80, 2080-576 Fazendas de Almeirim",
    source: "almeirim.city + OpenStreetMap",
    latitude: 39.1791369,
    longitude: -8.5922863,
  },
  {
    id: "almeirim-tejo",
    name: "Experiências do Tejo",
    category: "Lazer",
    kind: "Experiência",
    city: "Almeirim",
    address: "Almeirim, Santarém",
    source: "Clube Ribatejo (demo)",
  },
  {
    id: "almeirim-casa-ribatejana",
    name: "Casa Ribatejana",
    category: "Dormir",
    kind: "Alojamento",
    city: "Almeirim",
    address: "Almeirim, Santarém",
    source: "Clube Ribatejo (demo)",
  },
];

@Controller("businesses")
export class BusinessesController {
  @Get()
  list() {
    return { data: businesses, total: businesses.length };
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    const business = businesses.find((item) => item.id === id);
    if (!business)
      throw new NotFoundException("Estabelecimento não encontrado");
    return { data: business };
  }
}
