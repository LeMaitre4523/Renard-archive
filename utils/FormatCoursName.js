const formatExceptions = {
  mathematiques: 'Mathématiques',
  francais: 'Français',
  'physique-chimie': 'Physique-Chimie',
  'vie de classe': 'Vie de classe',
  'education civique': 'Éducation civique',
  'education musicale': 'Éducation musicale',
  'education physique et sportive': 'Éducation physique et sportive',
  'sciences de la vie et de la terre': 'Sciences de la vie et de la terre',
  'histoire-geographie': 'Histoire-Géographie',
  'sciences economiques et sociales': 'Sciences économiques et sociales',
  'llc angl.mond.cont.': 'LLCER Anglais Monde Contemporain',
  'accompagnemt. perso.': 'Accompagnement personnalisé',
  'numerique sc.inform.': 'Numérique et Sciences Informatiques',
  'ed.physique & sport.': 'Éducation physique et sportive',
  'sc.econo & sociales': 'Sciences économiques et sociales',
  'histoire & geograph.': 'Histoire-Géo',
  'sc.numeriq.technol.': 'Sciences Numériques et Technologie',
  'culture gene.et expr': 'Culture Générale et Expression',
  'maths pour informatq': 'Mathématiques pour l\'informatique',
  'cult.eco jur. manag.': 'Culture économique, juridique et managériale',
  'cul.eco.jur.man.app.': 'Culture économique, juridique et managériale appliquée',
  'at. professionnalis.': 'Atelier professionnalisant',
  'bloc 2 slam': 'Bloc 2 Solutions Logicielles et Applications Métiers '
  
};

const lengthExceptions = ['vie', 'de', 'et', 'la'];

function formatCoursName(name) {
  // return name with capitalized words only if they are longer than 3 characters
  let formattedName = name
    .split(' ')
    .map((word) => {
      if (word.length > 3) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      if (lengthExceptions.includes(word.toLowerCase())) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word;
    })
    .join(' ');

  // if formatExceptions contains a word contained in formattedName, replace it
  if (Object.keys(formatExceptions).includes(formattedName.toLowerCase())) {
    formattedName = formatExceptions[formattedName.toLowerCase()];
  }

  return formattedName;
}

export default formatCoursName;
