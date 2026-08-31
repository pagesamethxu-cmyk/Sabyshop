export const DIGITAL_PRODUCT_TYPES = [
  { value: 'ACCOUNT', label: 'គណនីពេញលេញ', labelEn: 'Full Account', badgeBg: '#EEF2FF', badgeColor: '#4F46E5', borderColor: '#C7D2FE' },
  { value: 'SHARING', label: 'គណនីចែករំលែក', labelEn: 'Sharing Account', badgeBg: '#FEF3C7', badgeColor: '#D97706', borderColor: '#FCD34D' },
  { value: 'KEY', label: 'កូដអាជ្ញាប័ណ្ណ', labelEn: 'Product Key', badgeBg: '#ECFDF5', badgeColor: '#059669', borderColor: '#6EE7B7' },
  { value: 'INVITE_LINK', label: 'តំណភ្ជាប់អញ្ជើញ', labelEn: 'Invite Link', badgeBg: '#F3E8FF', badgeColor: '#9333EA', borderColor: '#E9D5FF' },
  { value: 'KEY_ACTIVATION', label: 'កូដបើកដំណើរការ', labelEn: 'Activation Key', badgeBg: '#E0F2FE', badgeColor: '#0284C7', borderColor: '#BAE6FD' },
  { value: 'KEY_SERVER', label: 'កូដម៉ាស៊ីនបម្រើ', labelEn: 'Server Key', badgeBg: '#F1F5F9', badgeColor: '#334155', borderColor: '#CBD5E1' },
  { value: 'JOIN_MINECRAFT_PASSWORD', label: 'ពាក្យសម្ងាត់ម៉ាស៊ីនបម្រើ', labelEn: 'Server Password', badgeBg: '#FEF2F2', badgeColor: '#DC2626', borderColor: '#FCA5A5' },
  { value: 'ACCOUNT_GAME', label: 'គណនីហ្គេម', labelEn: 'Game Account', badgeBg: '#FFF7ED', badgeColor: '#EA580C', borderColor: '#FFEDD5' }
];

export const PRODUCT_DURATIONS = [
  { value: '1 Month', label: '១ ខែ', labelEn: '1 Month' },
  { value: '2 Months', label: '២ ខែ', labelEn: '2 Months' },
  { value: '3 Months', label: '៣ ខែ', labelEn: '3 Months' },
  { value: '6 Months', label: '៦ ខែ', labelEn: '6 Months' },
  { value: '1 Year', label: '១ ឆ្នាំ', labelEn: '1 Year' },
  { value: 'Lifetime', label: 'អចិន្ត្រៃយ៍', labelEn: 'Lifetime' },
  { value: '7 Days', label: '៧ ថ្ងៃ', labelEn: '7 Days' },
  { value: '15 Days', label: '១៥ ថ្ងៃ', labelEn: '15 Days' },
  { value: '30 Days', label: '៣០ ថ្ងៃ', labelEn: '30 Days' }
];

export const PRODUCT_LABELS = [
  { value: 'PROMO', label: 'បញ្ចុះតម្លៃពិសេស', labelEn: 'PROMO', badgeBg: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', badgeText: 'បញ្ចុះតម្លៃ', badgeTextEn: 'PROMO' },
  { value: 'FLASH_SALE', label: 'លក់បញ្ចុះតម្លៃរហ័ស', labelEn: 'FLASH SALE', badgeBg: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)', badgeText: 'បញ្ចុះតម្លៃរហ័ស', badgeTextEn: 'FLASH SALE' },
  { value: 'HOT_DEAL', label: 'តម្លៃពិសេស', labelEn: 'HOT DEAL', badgeBg: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', badgeText: 'តម្លៃពិសេស', badgeTextEn: 'HOT DEAL' },
  { value: 'SPECIAL_OFFER', label: 'ការផ្ដល់ជូនពិសេស', labelEn: 'SPECIAL OFFER', badgeBg: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)', badgeText: 'ផ្ដល់ជូនពិសេស', badgeTextEn: 'SPECIAL OFFER' },
  { value: 'DISCOUNT', label: 'បញ្ចុះតម្លៃ', labelEn: 'DISCOUNT', badgeBg: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)', badgeText: 'បញ្ចុះតម្លៃ', badgeTextEn: 'DISCOUNT' },
  { value: 'HOT', label: 'ពេញនិយម', labelEn: 'HOT', badgeBg: 'linear-gradient(135deg, #FF4500 0%, #FF8C00 100%)', badgeText: 'ពេញនិយម', badgeTextEn: 'HOT' },
  { value: 'BEST_SELLER', label: 'លក់ដាច់បំផុត', labelEn: 'BEST SELLER', badgeBg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', badgeText: 'លក់ដាច់បំផុត', badgeTextEn: 'BEST SELLER' },
  { value: 'NEW', label: 'ទំនិញថ្មី', labelEn: 'NEW', badgeBg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', badgeText: 'ថ្មី', badgeTextEn: 'NEW' },
  { value: 'NONE', label: 'ធម្មតា', labelEn: 'Standard', badgeBg: '', badgeText: '', badgeTextEn: '' }
];

export function getProductTypeInfo(typeValue, isKhmer = true) {
  if (!typeValue) return null;
  const valUpper = String(typeValue).toUpperCase();
  const match = DIGITAL_PRODUCT_TYPES.find(t => t.value === valUpper);
  if (match) {
    return {
      ...match,
      label: isKhmer ? match.label : match.labelEn
    };
  }
  return { value: typeValue, label: typeValue, badgeBg: '#F1F5F9', badgeColor: '#475569', borderColor: '#CBD5E1' };
}

export function getProductLabelInfo(labelValue, isKhmer = true) {
  if (!labelValue) return null;
  const valUpper = String(labelValue).toUpperCase();
  const match = PRODUCT_LABELS.find(l => l.value === valUpper);
  if (match && match.value !== 'NONE') {
    return {
      ...match,
      label: isKhmer ? match.label : match.labelEn,
      badgeText: isKhmer ? match.badgeText : (match.badgeTextEn || match.badgeText)
    };
  }
  return null;
}

export function resolveProductLabelInfo(product, isKhmer = true) {
  if (!product) return null;

  let labelValue = product.productLabel;

  if (!labelValue || labelValue === 'NONE' || labelValue === 'null' || labelValue === 'undefined') {
    return null;
  }

  if (labelValue === 'HOT') {
    const isHighVolume = (product.stockCount && product.stockCount >= 5) ||
      product.isBestSeller ||
      (product.salesCount && product.salesCount > 3) ||
      (product.totalSales && product.totalSales > 3);

    if (isHighVolume) {
      labelValue = 'BEST_SELLER';
    }
  }

  return getProductLabelInfo(labelValue, isKhmer);
}

export function getCategoryTypes(categoryName, isKhmer = true) {
  let types = DIGITAL_PRODUCT_TYPES;
  if (categoryName) {
    const nameLower = String(categoryName).toLowerCase();
    if (nameLower.includes('soft') || nameLower.includes('key') || nameLower.includes('license') || nameLower.includes('activat') || nameLower.includes('កូដ') || nameLower.includes('អាជ្ញាប័ណ្ណ')) {
      types = DIGITAL_PRODUCT_TYPES.filter(t => ['KEY_ACTIVATION', 'KEY', 'KEY_SERVER', 'ACCOUNT'].includes(t.value));
    } else if (nameLower.includes('game') || nameLower.includes('gaming') || nameLower.includes('ហ្គេម')) {
      types = DIGITAL_PRODUCT_TYPES.filter(t => ['ACCOUNT_GAME', 'JOIN_MINECRAFT_PASSWORD', 'ACCOUNT', 'KEY', 'KEY_ACTIVATION'].includes(t.value));
    } else if (nameLower.includes('stream') || nameLower.includes('music') || nameLower.includes('movie') || nameLower.includes('subscrip') || nameLower.includes('entertainment')) {
      types = DIGITAL_PRODUCT_TYPES.filter(t => ['SHARING', 'ACCOUNT', 'INVITE_LINK', 'KEY'].includes(t.value));
    }
  }
  return types.map(t => ({
    ...t,
    label: isKhmer ? t.label : t.labelEn
  }));
}

export function getDefaultTypeForCategory(categoryName) {
  if (!categoryName) return 'ACCOUNT';
  const nameLower = String(categoryName).toLowerCase();

  if (nameLower.includes('soft') || nameLower.includes('key') || nameLower.includes('license') || nameLower.includes('activat') || nameLower.includes('កូដ') || nameLower.includes('អាជ្ញាប័ណ្ណ')) {
    return 'KEY_ACTIVATION';
  }
  if (nameLower.includes('game') || nameLower.includes('gaming') || nameLower.includes('ហ្គេម')) {
    return 'ACCOUNT_GAME';
  }
  if (nameLower.includes('stream') || nameLower.includes('music') || nameLower.includes('movie') || nameLower.includes('subscrip')) {
    return 'SHARING';
  }
  return 'ACCOUNT';
}
