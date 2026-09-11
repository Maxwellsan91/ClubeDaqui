import { Controller, Get } from "@nestjs/common";

const businesses = [
  {
    id: "almeirim-tasca-bronze",
    name: "A Tasca do Bronze",
    category: "Comer",
    kind: "Restaurante",
    city: "Almeirim",
  },
  {
    id: "fazendas-a-adega",
    name: "A Adega",
    category: "Comer",
    kind: "Restaurante",
    city: "Fazendas de Almeirim",
  },
  {
    id: "fazendas-novo-conceito",
    name: "Adega Novo Conceito",
    category: "Comer",
    kind: "Adega",
    city: "Fazendas de Almeirim",
  },
  {
    id: "almeirim-tejo",
    name: "Experiências do Tejo",
    category: "Lazer",
    kind: "Experiência",
    city: "Almeirim",
  },
  {
    id: "almeirim-casa-ribatejana",
    name: "Casa Ribatejana",
    category: "Dormir",
    kind: "Alojamento",
    city: "Almeirim",
  },
];

@Controller("businesses")
export class BusinessesController {
  @Get()
  list() {
    return { data: businesses, total: businesses.length };
  }
}
