import { ClassLevel } from './types';

export const CURRICULUM_DATA: ClassLevel[] = [
  {
    id: 'nursery',
    name: 'Nursery',
    subjects: [
      {
        id: 'english-nursery',
        title: 'English Alphabets',
        chapters: [
          {
            id: 'abc-level',
            title: 'Letters A to G',
            topics: [
              {
                id: 'letter-a-c',
                title: 'A, B & C Letters',
                defaultContent: 'The letter A is for Apple. Apple is a Red and sweet fruit. Letter B is for Ball. You play with a ball on the playground. Letter C is for Cat. The cat says Meow. It likes milk.'
              }
            ]
          }
        ],
        iconName: 'BookOpen'
      }
    ]
  },
  {
    id: 'lkg',
    name: 'LKG',
    subjects: [
      {
        id: 'maths-lkg',
        title: 'Basic Numbers',
        chapters: [
          {
            id: 'numbers-1-10',
            title: 'Counting 1 to 10',
            topics: [
              {
                id: 'count-apples',
                title: 'Counting Items',
                defaultContent: 'Counting is fun! One elephant. Two lions. Three monkeys eating bananas. Four birds flying. Five fishes swimming in the beautiful blue ocean.'
              }
            ]
          }
        ],
        iconName: 'Calculator'
      }
    ]
  },
  {
    id: 'ukg',
    name: 'UKG',
    subjects: []
  },
  {
    id: 'class-1',
    name: 'Class 1',
    subjects: []
  },
  {
    id: 'class-2',
    name: 'Class 2',
    subjects: []
  },
  {
    id: 'class-3',
    name: 'Class 3',
    subjects: [
      {
        id: 'math-class3',
        title: 'Mathematics',
        titleNepali: 'गणित',
        iconName: 'Calculator',
        chapters: [
          {
            id: 'my-daily-life-1',
            title: 'My Daily Life 1',
            topics: [
              {
                id: 'time-1',
                title: 'Time 1',
                defaultContent: 'Telling time: reading the hour and minute hands on a clock. Understanding o\'clock, half past, quarter past, and quarter to.'
              }
            ]
          },
          {
            id: 'number-sense',
            title: 'Number Sense',
            topics: [
              {
                id: 'five-digit-numbers',
                title: 'Five Digit Numbers',
                defaultContent: 'Introduction to five-digit numbers up to 99999. Understanding place value: ten thousands, thousands, hundreds, tens, and ones. Reading and writing five-digit numbers in words and numerals.'
              },
              {
                id: 'comparison-of-numbers',
                title: 'Comparison of Numbers',
                defaultContent: 'Comparing numbers using greater than (>), less than (<), and equal to (=) symbols. Arranging numbers in ascending and descending order.'
              },
              {
                id: 'numbers-pattern',
                title: 'Number\'s Pattern',
                defaultContent: 'Identifying and extending number patterns. Recognizing skip counting patterns (2s, 5s, 10s) and simple arithmetic sequences.'
              }
            ]
          },
          {
            id: 'my-community',
            title: 'My Community',
            topics: [
              {
                id: 'ascending-descending',
                title: 'Ascending and Descending Order',
                defaultContent: 'Arranging numbers from smallest to largest (ascending) and largest to smallest (descending). Practical examples using daily life objects and numbers.'
              },
              {
                id: 'local-numerals',
                title: 'Local Numerals System up to 20',
                defaultContent: 'Introduction to Nepali local numeral system. Learning to read and write numbers up to 20 in both Nepali (देवनागरी) and English numerals.'
              },
              {
                id: 'fraction',
                title: 'Fraction',
                defaultContent: 'Basic concept of fractions: half (1/2), third (1/3), and quarter (1/4). Understanding numerator and denominator. Identifying fractions from shaded parts of shapes.'
              },
              {
                id: 'length-1',
                title: 'Length 1',
                defaultContent: 'Measuring length using standard units: centimeter (cm) and meter (m). Comparing lengths and understanding the relationship between different units.'
              }
            ]
          },
          {
            id: 'my-creation',
            title: 'My Creation',
            topics: [
              {
                id: 'lines',
                title: 'Lines',
                defaultContent: 'Introduction to different types of lines: straight lines, curved lines, horizontal lines, vertical lines, and slanting lines. Identifying lines in everyday objects.'
              },
              {
                id: 'angles',
                title: 'Angles',
                defaultContent: 'Basic concept of angles. Understanding right angles, acute angles (less than 90°), and obtuse angles (more than 90°). Identifying angles in classroom objects.'
              },
              {
                id: 'geometrical-shapes',
                title: 'Geometrical Shapes',
                defaultContent: 'Identifying and describing 2D shapes: circle, square, rectangle, triangle, and pentagon. Number of sides and corners for each shape.'
              }
            ]
          },
          {
            id: 'basic-operations',
            title: 'Basic Operation in Mathematics',
            topics: [
              {
                id: 'addition',
                title: 'Addition',
                defaultContent: 'Addition of numbers up to five digits. Carrying over in addition. Word problems involving addition in daily life contexts.'
              },
              {
                id: 'subtraction',
                title: 'Subtraction',
                defaultContent: 'Subtraction of numbers up to five digits. Borrowing in subtraction. Checking subtraction using addition. Real-life subtraction word problems.'
              },
              {
                id: 'multiplication',
                title: 'Multiplication',
                defaultContent: 'Multiplication tables from 2 to 10. Multiplication of two-digit numbers by one-digit numbers. Understanding multiplication as repeated addition.'
              },
              {
                id: 'division',
                title: 'Division',
                defaultContent: 'Basic division concepts: dividend, divisor, quotient, and remainder. Division as equal sharing and repeated subtraction. Simple division word problems.'
              }
            ]
          },
          {
            id: 'my-daily-life-2',
            title: 'My Daily Life 2',
            topics: [
              {
                id: 'time-2',
                title: 'Time 2',
                defaultContent: 'Calculating time duration. Understanding a.m. and p.m. Reading calendars: days, weeks, and months. Solving problems involving elapsed time.'
              }
            ]
          },
          {
            id: 'comm-tech-markets',
            title: 'Communication Technology and Markets',
            topics: [
              {
                id: 'money',
                title: 'Money',
                defaultContent: 'Nepali currency: coins and notes. Converting between rupees and paisa. Adding and subtracting amounts of money. Making change and simple budgeting.'
              },
              {
                id: 'capacity',
                title: 'Capacity',
                defaultContent: 'Measuring capacity using standard units: liter (L) and milliliter (mL). Comparing capacities of different containers. Practical examples using water and liquids.'
              },
              {
                id: 'length-2',
                title: 'Length 2',
                defaultContent: 'Advanced length measurement: converting between cm and m. Adding and subtracting lengths. Measuring perimeters of simple shapes.'
              },
              {
                id: 'weight',
                title: 'Weight',
                defaultContent: 'Measuring weight using standard units: kilogram (kg) and gram (g). Comparing weights. Reading a weighing scale. Estimating weight of everyday objects.'
              },
              {
                id: 'pictograph',
                title: 'Pictograph',
                defaultContent: 'Introduction to pictographs. Reading and interpreting data from pictographs. Creating simple pictographs using symbols to represent data.'
              }
            ]
          },
          {
            id: 'measurement',
            title: 'Measurement',
            topics: [
              {
                id: 'area',
                title: 'Area',
                defaultContent: 'Concept of area as the space inside a shape. Measuring area using unit squares. Comparing areas of different shapes. Counting square units to find area.'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'class-4',
    name: 'Class 4',
    subjects: []
  },
  {
    id: 'class-5',
    name: 'Class 5',
    subjects: [
      {
        id: 'science-tech-5',
        title: 'Science and Technology',
        titleNepali: 'विज्ञान तथा प्रविधि',
        iconName: 'Atom',
        chapters: [
          {
            id: 'sci5-unit1',
            title: 'Scientific Learning',
            topics: []
          },
          {
            id: 'sci5-unit2',
            title: 'Information and Communication Technology',
            topics: []
          },
          {
            id: 'sci5-unit3',
            title: 'Organisms and Environment',
            topics: []
          },
          {
            id: 'sci5-unit4',
            title: 'Classification of Living Beings',
            topics: []
          },
          {
            id: 'sci5-unit5',
            title: 'Life Process',
            topics: []
          },
          {
            id: 'sci5-unit6',
            title: 'Matter',
            topics: []
          },
          {
            id: 'sci5-unit7',
            title: 'Energy',
            topics: []
          },
          {
            id: 'sci5-unit8',
            title: 'The Earth and Space',
            topics: []
          }
        ]
      },
      {
        id: 'soc-stud-creative-arts-5',
        title: 'Social Studies Creative Arts (English)',
        titleNepali: 'सामाजिक अध्ययन तथा सिर्जनात्मक कला',
        iconName: 'Globe',
        chapters: [
          {
            id: 'ss5-unit1',
            title: 'Me, My family and Neighbours',
            topics: []
          },
          {
            id: 'ss5-unit2',
            title: 'Our Traditions, Social Norms and Values',
            topics: []
          },
          {
            id: 'ss5-unit3',
            title: 'Social Problems and their Solutions',
            topics: []
          },
          {
            id: 'ss5-unit4',
            title: 'Civics Sense',
            topics: []
          },
          {
            id: 'ss5-unit5',
            title: 'Our Earth',
            topics: []
          },
          {
            id: 'ss5-unit6',
            title: 'Our Past',
            topics: []
          },
          {
            id: 'ss5-unit7',
            title: 'Our Economic Activities',
            topics: []
          }
        ]
      }
    ]
  },
  {
    id: 'class-6',
    name: 'Class 6',
    subjects: []
  },
  {
    id: 'class-7',
    name: 'Class 7',
    subjects: [
      {
        id: 'social-studies',
        title: 'Social Studies',
        titleNepali: 'सामाजिक अध्ययन',
        iconName: 'Globe',
        chapters: [
          {
            id: 'our-society',
            title: 'We and Our Society',
            titleNepali: 'हामी र हाम्रो समाज',
            topics: [
              {
                id: 'origin-evolution',
                title: 'Origin and Evolution of Society',
                titleNepali: 'समाजको उत्पत्ति र विकासक्रम',
                defaultContent: `मानव समाजको विकास क्रम एकै पटक भएको होइन। प्राचीन कालमा मानिसहरू जंगली अवस्थामा थिए, ओढारमा बस्थे र कन्दमूल खोजेर वा जंगली जनावरको शिकार गरेर जीविकोपार्जन गर्थे। बिस्तारै मानिसले ढुङ्गे औजार बनाउन सिक्यो, आगोको आविष्कार गर्यो र जंगली जनावरलाई नियन्त्रणमा लिन थाल्यो।

यसरी मानिसहरू सुरक्षा र सहकार्यको खोजी गर्दै सामूहिक रूपमा बस्न थाले, जसबाट समाजको उत्पत्ति भयो। कृषि युगको सुरुवातसँगै मानिसले नदी किनारमा स्थायी बस्ती बसाउन थाले। विभिन्न चरणहरू जस्तै:
१. शिकार तथा संकलन युग (Hunting and Gathering Stage)
२. पशुपालन युग (Pastoral Stage)
३. कृषि युग (Agricultural Stage)
४. औद्योगिक युग (Industrial Stage)
५. आधुनिक/सूचना प्रविधि युग (Modern/Information Technology Stage)

यसरी विभिन्न क्रमिक परिवर्तनहरू पार गर्दै र संगठित बन्दै आजको सभ्य र आधुनिक समाजको विकास भएको हो। सामाजिक जीवनलाई सुव्यवस्थित बनाउन धर्म, संस्कृति, कला, नियम र कानुन जस्ता संस्थाहरू निर्माण हुँदै गए।`
              },
              {
                id: 'socialization',
                title: 'Socialization',
                titleNepali: 'सामाजिकीकरण',
                defaultContent: `सामाजिकीकरण (Socialization) भनेको जीवनभर चलिरहने एक प्रक्रिया हो जसद्वारा व्यक्तिले समाजको मूल्यमान्यता, आदर्श, व्यवहार, संस्कृति र नियमहरू सिक्दछ। जन्मदा शिशु केवल एक जैविक प्राणी मात्र हुन्छ। तर परिवार, छिमेकी, विद्यालय, सञ्चार माध्यम र साथीभाइको सम्पर्कमा आएपछि उसले समाजमा कसरी बस्ने, कसरी बोल्ने र कस्तो आचरण देखाउने भन्ने कुराहरू सिक्छ।

सामाजिकीकरणका मुख्य माध्यमहरू:
१. प्राथमिक माध्यम: परिवार र अभिभावक (सबैभन्दा महत्त्वपूर्ण सुरुवाती सिकाई स्थान)
२. माध्यमिक माध्यम: साथीभाइ, विद्यालय, छरछिमेक, संचारमाध्यम, र धार्मिक सङ्गठनहरू

यस प्रक्रियाले व्यक्तिलाई समाजको जिम्मेवार नागरिक बनाउँछ, अर्काको सम्मान गर्न सिकाउँछ र समाजको नियम अनुरूप चल्न योग्य बनाउँछ।`
              },
              {
                id: 'infrastructure-edu-health',
                title: 'Infrastructure of Development: Education and Health',
                titleNepali: 'विकासका पूर्वाधार: शिक्षा र स्वास्थ्य',
                defaultContent: `कुनै पनि देश वा समाजको चौतर्फी विकासका लागि आवश्यक जग वा आधारभूत संरचनालाई विकासका पूर्वाधार भनिन्छ। यी पूर्वाधारहरू मध्ये 'शिक्षा' र 'स्वास्थ्य' मानव स्रोत विकासका सबैभन्दा महत्त्वपूर्ण आधार हुन्।

१. शिक्षा (Education)
शिक्षाले मानिसलाई ज्ञान, सीप र चेतना प्रदान गर्दछ। यसले दक्ष जनशक्ति (जस्तै: डाक्टर, इन्जिनियर, शिक्षक, वैज्ञानिक) उत्पादन गर्छ। शिक्षाविना देशमा रहेका अन्य प्राकृतिक स्रोतसाधनको सही सदुपयोग हुन सक्दैन। त्यसैले शिक्षा सबै पूर्वाधारहरूको पनि पूर्वाधार हो।

२. स्वास्थ्य (Health)
"स्वास्थ्य नै सबैभन्दा ठूलो धन हो।" निरोगी र स्वस्थ नागरिकले मात्र देशको विकास कार्यमा प्रभावकारी योगदान दिन सक्छन्। यदि नागरिकहरू रोगी र कमजोर भएमा उनीहरूको उपचारमा ठूलो सरकारी बजेट खर्च हुन्छ र उत्पादनशीलता घट्छ। त्यसैले देशमा आधारभूत स्वास्थ्य चौकी, अस्पताल र शुद्ध पिउने पानीको व्यवस्था हुन जरुरी छ।`
              },
              {
                id: 'infrastructure-transport',
                title: 'Infrastructure of Development: Transport and Communication',
                titleNepali: 'विकासका पूर्वाधार: यातायात र सञ्चार',
                defaultContent: `यातायात र सञ्चार देशको आर्थिक तथा भौतिक विकासका मुख्य मेरुदण्ड हुन्। यिनले देशका कुनाकाप्चालाई राष्ट्रिय र अन्तर्राष्ट्रिय बजारसँग जोड्ने काम गर्छन्।

१. यातायात (Transportation)
यातायातका साधनहरू (जस्तै: सडक मार्ग, हवाई मार्ग, रेलमार्ग र जलमार्ग) ले मानिस र सामानहरूलाई एक ठाउँबाट अर्को ठाउँमा सजिलै ओसारपसार गर्न मद्दत गर्छन्। कृषि उत्पादनलाई बजारसम्म पुर्‍याउन र बिरामीलाई समयमै अस्पताल पुर्‍याउन यातायात अति आवश्यक छ।

२. सञ्चार (Communication)
सञ्चार भनेको सूचना र विचारहरूको आदानप्रदान हो। इन्टरनेट, रेडियो, टेलिभिजन, पत्रपत्रिका, मोबाइल र सामाजिक सञ्जालले संसारलाई एक सानो गाउँ (Global Village) मा परिणत गरिदिएका छन्। यसले व्यापार, शिक्षा, विपद् व्यवस्थापन र प्रशासन सञ्चालनलाई द्रुत र पारदर्शी बनाएको छ।`
              },
              {
                id: 'district-coordination',
                title: 'District Coordination Committee',
                titleNepali: 'जिल्ला समन्वय समिति',
                defaultContent: `नेपालको संघीय संरचना अनुसार जिल्ला समन्वय समिति (District Coordination Committee - DCC) जिल्ला स्तरमा नीतिगत समन्वय र विकास कार्यहरूको व्यवस्थापन गर्ने एक महत्त्वपूर्ण निकाय हो। 

नेपालको संविधानको धारा २२० बमोजिम प्रत्येक जिल्लामा एक जिल्ला सभा रहनेछ र सो जिल्ला सभाले जिल्ला समन्वय समितिको गठन गर्नेछ। यसमा प्रमुख, उपप्रमुख र कम्तीमा तीन जना महिला र कम्तीमा एक जना दलित वा अल्पसंख्यक सहित बढीमा नौ जना सदस्यहरू निर्वाचित हुन्छन्।

यसका मुख्य कार्य र अधिकारहरू:
१. जिल्लाभित्रका गाउँपालिका र नगरपालिकाहरूबीच विकासका कार्यमा समन्वय गर्ने।
२. जिल्ला स्तरमा विकास निर्माण कार्यको अनुगमन र मूल्याङ्कन गर्ने।
३. प्रदेश र संघीय सरकारी कार्यालय तथा स्थानीय तहबीच समन्वयकारी भूमिका निर्वाह गर्ने।
४. गैरसरकारी संस्था र निजी क्षेत्रले जिल्लामा गर्ने कार्यहरूको रेखदेख र समन्वय गर्ने।`
              }
            ]
          },
          {
            id: 'human-values',
            title: 'Our Human Values and Beliefs',
            titleNepali: 'हाम्रा मानव मूल्य मान्यता',
            topics: []
          },
          {
            id: 'civic-con',
            title: 'Civic Consciousness, Rights and Duties',
            titleNepali: 'नागरिक चेतना, अधिकार र कर्तव्य',
            topics: []
          },
          {
            id: 'social-problems',
            title: 'Social Problems and Solutions',
            titleNepali: 'सामाजिक समस्या र समाधान',
            topics: []
          }
        ]
      },
      {
        id: 'nepali-class7',
        title: 'Nepali',
        titleNepali: 'नेपाली',
        iconName: 'Book',
        chapters: [
          {
            id: 'nepali-ch1',
            title: 'Kabita: Desh Prem',
            titleNepali: 'कविता: देश प्रेम',
            topics: [
              {
                id: 'desh-prem-topic',
                title: 'Deshbhakti Shishak',
                titleNepali: 'देशभक्ति शीर्षक का व्याख्या',
                defaultContent: `नेपाली राष्ट्रियता र देशभक्तिको भावनाले भरिएको यो कविता अत्यन्तै मार्मिक छ। कविले आफ्नो देशको प्राकृतिक सौन्दर्य, हिमाल, पहाड, तराई र यहाँका मानिसहरूको एकतालाई उजागर गरेका छन्। हामी जहाँ रहे पनि हाम्रो पहिलो पहिचान नेपाली नै हो भन्ने भावना यस कविताले जगाउँछ।`
              }
            ]
          }
        ]
      },
      {
        id: 'science-class7',
        title: 'Science & Technology',
        titleNepali: 'विज्ञान तथा प्रविधि',
        iconName: 'Atom',
        chapters: [
          {
            id: 'science-ch1',
            title: 'Force and Motion',
            titleNepali: 'बल र गति',
            topics: [
              {
                id: 'force-definition',
                title: 'Introduction to Force',
                titleNepali: 'बलको परिचय',
                defaultContent: `विज्ञानमा बल (Force) भन्नाले कुनै पनि वस्तुलाई तान्ने वा धकेल्ने कार्यलाई बुझाउँछ। यसले स्थिर रहेको वस्तुलाई गतिमा ल्याउन सक्छ, वा गतिमा रहेको वस्तुलाई रोक्न सक्छ। 

बलको एकाइ न्युटन (Newton - N) हो। बल मुख्यतया दुई प्रकारका हुन्छन्:
१. सम्पर्क बल (Contact Force) - जस्तै: घर्षण बल, मांशपेसीय बल।
२. असम्पर्क बल (Non-contact Force) - जस्तै: गुरुत्वाकर्षण बल, चुम्बकीय बल।`
              }
            ]
          }
        ]
      }
    ]
  }
];
