# Política de Segurança

Este repositório contém um site estático que exibe informações públicas sobre a rede de apoio à população em situação de rua de Araraquara/SP.  
Não há backend, banco de dados, autenticação de usuários ou coleta de dados sensíveis.  
Mesmo assim, prezamos pela segurança e estabilidade do projeto.

---

## 🔐 Relato de Vulnerabilidades

Caso encontre algum problema de segurança, comportamento suspeito ou risco potencial no código:

1. Abra uma **Issue** no repositório descrevendo o problema.
2. Se preferir relatar de forma privada, envie um e-mail para:  
   **clbiffe@araraquara.sp.gov.br**

---

## 🛡 Escopo de Segurança

Como não há backend, as vulnerabilidades mais comuns são:

- Exposição indevida de chaves públicas de API (Google Maps)
- Scripts externos bloqueados ou alterados
- Mau uso de `innerHTML` levando a risco de XSS
- Links externos quebrados
- Erros na configuração de PWA (manifest ou service worker)

---

## 🚫 Fora do Escopo

Os seguintes pontos **não** são considerados vulnerabilidades:

- Disponibilidade do mapa (Google Maps depende de serviços externos)
- Informações incorretas ou desatualizadas nos pontos
- Falhas na geolocalização do celular (depende do dispositivo)
- Limitações do modo offline PWA (restrições do navegador)
- Dados públicos exibidos no mapa

---

## 🧪 Melhorias e Sugestões

Este projeto é aberto a contribuições.  
Caso identifique melhorias, desempenho lento, acessibilidade ou usabilidade ruim, abra um Pull Request ou Issue.

Obrigado por contribuir com um projeto público!  
