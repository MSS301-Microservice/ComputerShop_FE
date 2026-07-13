
// Fix: Import from types/index.ts instead of types.ts
import { Product } from '../types/index';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'ASUS ROG Strix RTX 4090 White Edition',
    brand: 'ASUS',
    category: 'VGA',
    price: 1999,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8IDBnosBBWTRTw5-Csko9_4ZNThhZBu9rqcuTIBxUWj2Z8B4hnZD8V2gUrcO2cICqXV8Po710mulXyPSKPhE-Amt_mwi7laNBmSXOeRRDSf9w1u0ei82sx8EgTXAnYAsJI2BrkBDJJRjVDgKkTAnB1b2kCGAbYdtdTHsybb-VobH5PmG28guurMejXAtx4Ho2yF-V-iwDcl_0GDIGMDEpX5AssBUJEHFPR7MDhQdrbnsu3qPIhxhbQ0IBOFYuPHv5DDw8_WA8st8',
    tag: 'Hot',
    description: 'Phiên bản Trắng / 24GB GDDR6X',
    specs: {
      'Vi xử lý (CPU)': 'Intel Core i9-13900K',
      'Card đồ họa (VGA)': 'NVIDIA GeForce RTX 4090 24GB GDDR6X',
      'Bộ nhớ (RAM)': '64GB DDR5 6000MHz'
    }
  },
  {
    id: '2',
    name: 'Keychron Q1 Pro Mechanical Keyboard',
    brand: 'Keychron',
    category: 'Bàn phím',
    price: 199,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkWkROItsWA04r1gmopDydIOZFdt9kuNJSpLlH5-q93QZ1zSQ4Wla-shsDvwkUCUW5Ew2t8-2ArTeZxkzSetcqrwRlMOvAkl_3Reu7ovrmNxfKTsgWgu0FPpiBFnMHDC1Tb7LMf6UhP0oeZ14MYW4QCfUtiVI6WPPTEdAQoiOq2QlluFo9rdcu1HYC5aDljl4FZtSH_xVxTFubnRrNIjht07Fui6NMqION0PUy4kR43iLlPAFYiUqvADIPRZzBGWtH6PA86VySxwU',
    tag: 'Mới'
  },
  {
    id: '3',
    name: 'Apple MacBook Pro 16 M3 Max',
    brand: 'Apple',
    category: 'Laptop',
    price: 3999,
    originalPrice: 4200,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCr8FzH5F4kZaRIGspEQMO-CLM58UYbwo0A6SLIS4_gykaHc9dTMH3fp1fOnuzco5lqL2ZZyS6qxOH9-7XYnZnlvYfTVEUBBNZVLtMPGi9J16dtloRxXPtIfTlUFfLkGlXXsemYcyQZCoHNw012xAZ5U9C4EFu5FhZgpu4kYeNRS1wItZ4ccjY87L9uig8_Ozw3rH90vaoAjQJxIRabb1rvBP5qQM5CRwNAfOen2q8tsmeYVpdA581-q-AX2f8C3wUTte6A-muC7K8',
    tag: 'Giảm giá'
  },
  {
    id: '4',
    name: 'Logitech G Pro X Superlight',
    brand: 'Logitech',
    category: 'Chuột',
    price: 159,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIcU7HYW6uJVxD2X9hKyLIeECmgVvDDX0fFHGc6VgN1MqDQW8BJFZiTM--stEs17o8mWlt-5m6DzlByKehlW2Vz2TJcvTDZ2RuNYPfSLghdkWrxFqHWar8Ec5xM0rC--l0Lyx2FNRAAMotWUMo9_n5LCt3biOElTvw4hU99gWEaCtFis3k4tCnV4r0KjG_xHl_spNereti-7cNX8xrhNnRsdSv8kaoY379r4MzUtoOnRqTNoHQ_rId7-CCPsAK3teQsPNveCPf3kg'
  },
  {
    id: '5',
    name: 'MSI Raider GE78 HX',
    brand: 'MSI',
    category: 'Laptop',
    price: 3299,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOSPFHG6GSn8QGVfVQHtKhuTls0Cf_a0PPBVyGWBWXELHIIpHSg2_Ovkti0FpK-C31xs_0KvIJwYGGU5l4RsGRSudHKdY-dFQHUwEGJarOp1xyq7n2UVcZDWN0HK_ye53514XC0Cp1JMAgqUHXwstG0D_RQJ970YVjWaC6sQDbLmHV8GXyVWi9Hzb7Kkjv0MIsfRCIIgtDqqhEN8wQHtIC20NNPCUUHn-G33jkNqxMn2wW8-5UphkdtvWMVJEpeoRxNiasauT2a_Y',
    tag: 'Hot'
  },
  {
    id: '6',
    name: 'Intel Core i9-14900K',
    brand: 'Intel',
    category: 'CPU',
    price: 589,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMOHdFA3XTXAcM80rjSMRd5he5w7XyvbPyJqQcgjCxWpNcTuCAhi632wFZ1AEk-Yu2V1u98siSDnWI0gqe9mJuirSb-MT_Ja8yxpxXcVB3FzWuFs1fwZbh0mcbj4-aAOhLHHuSxNcRKQ7TNoNaU3wowCci0R1EwSQLdTqpObhGfpMxSTyglK1eU9cN0LTio5DzqivUWNndpJMfL26m_4JvOO2rS2QiWofdNwmPnqudFd39UwQuOqaTsGaBNtkgQKxIOd45ygiD3BE',
    tag: 'Mới'
  },
  {
    id: '8',
    name: 'Mainboard ASUS ROG MAXIMUS Z790 HERO',
    brand: 'ASUS',
    category: 'Mainboard',
    price: 699,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8IDBnosBBWTRTw5-Csko9_4ZNThhZBu9rqcuTIBxUWj2Z8B4hnZD8V2gUrcO2cICqXV8Po710mulXyPSKPhE-Amt_mwi7laNBmSXOeRRDSf9w1u0ei82sx8EgTXAnYAsJI2BrkBDJJRjVDgKkTAnB1b2kCGAbYdtdTHsybb-VobH5PmG28guurMejXAtx4Ho2yF-V-iwDcl_0GDIGMDEpX5AssBUJEHFPR7MDhQdrbnsu3qPIhxhbQ0IBOFYuPHv5DDw8_WA8st8',
    tag: 'Hot'
  },
  {
    id: '9',
    name: 'RAM Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz',
    brand: 'Corsair',
    category: 'RAM',
    price: 129,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkWkROItsWA04r1gmopDydIOZFdt9kuNJSpLlH5-q93QZ1zSQ4Wla-shsDvwkUCUW5Ew2t8-2ArTeZxkzSetcqrwRlMOvAkl_3Reu7ovrmNxfKTsgWgu0FPpiBFnMHDC1Tb7LMf6UhP0oeZ14MYW4QCfUtiVI6WPPTEdAQoiOq2QlluFo9rdcu1HYC5aDljl4FZtSH_xVxTFubnRrNIjht07Fui6NMqION0PUy4kR43iLlPAFYiUqvADIPRZzBGWtH6PA86VySxwU',
  },
  {
    id: '10',
    name: 'SSD Samsung 990 Pro 1TB M.2 NVMe',
    brand: 'Samsung',
    category: 'SSD',
    price: 169,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCr8FzH5F4kZaRIGspEQMO-CLM58UYbwo0A6SLIS4_gykaHc9dTMH3fp1fOnuzco5lqL2ZZyS6qxOH9-7XYnZnlvYfTVEUBBNZVLtMPGi9J16dtloRxXPtIfTlUFfLkGlXXsemYcyQZCoHNw012xAZ5U9C4EFu5FhZgpu4kYeNRS1wItZ4ccjY87L9uig8_Ozw3rH90vaoAjQJxIRabb1rvBP5qQM5CRwNAfOen2q8tsmeYVpdA581-q-AX2f8C3wUTte6A-muC7K8',
  },
  {
    id: '11',
    name: 'Nguồn Corsair RM1000x 1000W 80 Plus Gold',
    brand: 'Corsair',
    category: 'PSU',
    price: 189,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIcU7HYW6uJVxD2X9hKyLIeECmgVvDDX0fFHGc6VgN1MqDQW8BJFZiTM--stEs17o8mWlt-5m6DzlByKehlW2Vz2TJcvTDZ2RuNYPfSLghdkWrxFqHWar8Ec5xM0rC--l0Lyx2FNRAAMotWUMo9_n5LCt3biOElTvw4hU99gWEaCtFis3k4tCnV4r0KjG_xHl_spNereti-7cNX8xrhNnRsdSv8kaoY379r4MzUtoOnRqTNoHQ_rId7-CCPsAK3teQsPNveCPf3kg',
  },
  {
    id: '12',
    name: 'Vỏ Case LIAN LI O11 Dynamic EVO White',
    brand: 'Lian Li',
    category: 'Case',
    price: 179,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOSPFHG6GSn8QGVfVQHtKhuTls0Cf_a0PPBVyGWBWXELHIIpHSg2_Ovkti0FpK-C31xs_0KvIJwYGGU5l4RsGRSudHKdY-dFQHUwEGJarOp1xyq7n2UVcZDWN0HK_ye53514XC0Cp1JMAgqUHXwstG0D_RQJ970YVjWaC6sQDbLmHV8GXyVWi9Hzb7Kkjv0MIsfRCIIgtDqqhEN8wQHtIC20NNPCUUHn-G33jkNqxMn2wW8-5UphkdtvWMVJEpeoRxNiasauT2a_Y',
  },
  {
    id: '13',
    name: 'CPU AMD Ryzen 9 7950X',
    brand: 'AMD',
    category: 'CPU',
    price: 549,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMOHdFA3XTXAcM80rjSMRd5he5w7XyvbPyJqQcgjCxWpNcTuCAhi632wFZ1AEk-Yu2V1u98siSDnWI0gqe9mJuirSb-MT_Ja8yxpxXcVB3FzWuFs1fwZbh0mcbj4-aAOhLHHuSxNcRKQ7TNoNaU3wowCci0R1EwSQLdTqpObhGfpMxSTyglK1eU9cN0LTio5DzqivUWNndpJMfL26m_4JvOO2rS2QiWofdNwmPnqudFd39UwQuOqaTsGaBNtkgQKxIOd45ygiD3BE',
  },
  {
    id: '14',
    name: 'Màn hình Samsung Odyssey Neo G9',
    brand: 'Samsung',
    category: 'Màn hình',
    price: 1799,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCr8FzH5F4kZaRIGspEQMO-CLM58UYbwo0A6SLIS4_gykaHc9dTMH3fp1fOnuzco5lqL2ZZyS6qxOH9-7XYnZnlvYfTVEUBBNZVLtMPGi9J16dtloRxXPtIfTlUFfLkGlXXsemYcyQZCoHNw012xAZ5U9C4EFu5FhZgpu4kYeNRS1wItZ4ccjY87L9uig8_Ozw3rH90vaoAjQJxIRabb1rvBP5qQM5CRwNAfOen2q8tsmeYVpdA581-q-AX2f8C3wUTte6A-muC7K8',
  },
  {
    id: '15',
    name: 'Ghế Gaming Herman Miller x Logitech G Embody',
    brand: 'Herman Miller',
    category: 'Phụ kiện',
    price: 1595,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIcU7HYW6uJVxD2X9hKyLIeECmgVvDDX0fFHGc6VgN1MqDQW8BJFZiTM--stEs17o8mWlt-5m6DzlByKehlW2Vz2TJcvTDZ2RuNYPfSLghdkWrxFqHWar8Ec5xM0rC--l0Lyx2FNRAAMotWUMo9_n5LCt3biOElTvw4hU99gWEaCtFis3k4tCnV4r0KjG_xHl_spNereti-7cNX8xrhNnRsdSv8kaoY379r4MzUtoOnRqTNoHQ_rId7-CCPsAK3teQsPNveCPf3kg',
  }
];
