
// Get unused passes that don't have name and phone data (safe to update)
var unusedPasses = db.passes.find({
  status: 'unused',
  name: {$exists: false},
  phone: {$exists: false}
}).limit(389).toArray();

console.log('Found', unusedPasses.length, 'unused passes without visitor data to safely update');

// Visitor data
var visitors = [
  {
    "name": "abdul",
    "phone": "9884999925"
  },
  {
    "name": "rama krishnan",
    "phone": "9487294758"
  },
  {
    "name": "ramakrishnan",
    "phone": "8608685995"
  },
  {
    "name": "SHIVA",
    "phone": "9789890420"
  },
  {
    "name": "rajendran",
    "phone": "9444431100"
  },
  {
    "name": "AJITH KUMAR",
    "phone": "9820050738"
  },
  {
    "name": "rajan",
    "phone": "9789974026"
  },
  {
    "name": "prakash",
    "phone": "9751274536"
  },
  {
    "name": "Gomathi",
    "phone": "9003940802"
  },
  {
    "name": "kalidasan",
    "phone": "9841141112"
  },
  {
    "name": "velu",
    "phone": "9677166748"
  },
  {
    "name": "Srinivasan",
    "phone": "9841418842"
  },
  {
    "name": "vijayasegar",
    "phone": "9443038375"
  },
  {
    "name": "DINADHAYALAN",
    "phone": "8939361650"
  },
  {
    "name": "babu",
    "phone": "9445761221"
  },
  {
    "name": "kudiarasu",
    "phone": "9940619056"
  },
  {
    "name": "SURESH",
    "phone": "9003194309"
  },
  {
    "name": "Nizammuddin",
    "phone": "9443131509"
  },
  {
    "name": "sengodan",
    "phone": "9444716857"
  },
  {
    "name": "Govindaswamy",
    "phone": "9841092373"
  },
  {
    "name": "Vijay",
    "phone": "9176579147"
  },
  {
    "name": "maraen",
    "phone": "9787023707"
  },
  {
    "name": "James",
    "phone": "9962066484"
  },
  {
    "name": "velumurugan",
    "phone": "9789073718"
  },
  {
    "name": "mohana priyan",
    "phone": "7010864643"
  },
  {
    "name": "KAMALAKANNAN",
    "phone": "7358686083"
  },
  {
    "name": "suresh",
    "phone": "9940190571"
  },
  {
    "name": "ragubathy",
    "phone": "8608006502"
  },
  {
    "name": "prakasam",
    "phone": "9382889752"
  },
  {
    "name": "MOORTHY",
    "phone": "9884179872"
  },
  {
    "name": "Dhakshina Moorthy",
    "phone": "8608055386"
  },
  {
    "name": "HARI",
    "phone": "8886066987"
  },
  {
    "name": "RAJ",
    "phone": "9360257269"
  },
  {
    "name": "anwar basha",
    "phone": "9362906467"
  },
  {
    "name": "PRADEEP",
    "phone": "9176766027"
  },
  {
    "name": "thiyagu",
    "phone": "9941606175"
  },
  {
    "name": "SINDHIYA",
    "phone": "9500024119"
  },
  {
    "name": "ravikumar",
    "phone": "9884371098"
  },
  {
    "name": "MOHAN",
    "phone": "9840179000"
  },
  {
    "name": "prabu",
    "phone": "9840339894"
  },
  {
    "name": "MURALI",
    "phone": "9841606178"
  },
  {
    "name": "haran",
    "phone": "9600195592"
  },
  {
    "name": "RAVI",
    "phone": "8883792573"
  },
  {
    "name": "karthick",
    "phone": "8939465139"
  },
  {
    "name": "arumugam",
    "phone": "9952589240"
  },
  {
    "name": "BOSS",
    "phone": "9840372217"
  },
  {
    "name": "maidhin",
    "phone": "9626417676"
  },
  {
    "name": "Harikrishnan",
    "phone": "9003181137"
  },
  {
    "name": "VIJI",
    "phone": "9176660210"
  },
  {
    "name": "Malathy",
    "phone": "9962650570"
  },
  {
    "name": "Rangarajan",
    "phone": "9445794314"
  },
  {
    "name": "RAVI",
    "phone": "9344331640"
  },
  {
    "name": "ramesh",
    "phone": "9962275030"
  },
  {
    "name": "venkatesan",
    "phone": "7200710527"
  },
  {
    "name": "MAHADEVAN",
    "phone": "9361355251"
  },
  {
    "name": "nageshwaran",
    "phone": "9176112261"
  },
  {
    "name": "sendhilkumar",
    "phone": "9791016657"
  },
  {
    "name": "KUMAR",
    "phone": "9840725008"
  },
  {
    "name": "murugan",
    "phone": "9176750506"
  },
  {
    "name": "vishvanathan",
    "phone": "9698797423"
  },
  {
    "name": "vijaya lakshmi",
    "phone": "9841113049"
  },
  {
    "name": "RAGHUPATHI",
    "phone": "9994095126"
  },
  {
    "name": "Vijiyalakshimi",
    "phone": "8056057644"
  },
  {
    "name": "siva",
    "phone": "9042645552"
  },
  {
    "name": "SRIDHAR",
    "phone": "9080498751"
  },
  {
    "name": "IYYAPPAN",
    "phone": "9941205264"
  },
  {
    "name": "BALASUBRAMANIYAM",
    "phone": "9884464753"
  },
  {
    "name": "kannan",
    "phone": "9003282714"
  },
  {
    "name": "Ramesh",
    "phone": "7550234299"
  },
  {
    "name": "sheik usman",
    "phone": "9840191776"
  },
  {
    "name": "PERUMAL",
    "phone": "9962211605"
  },
  {
    "name": "thilagavathi",
    "phone": "9444316159"
  },
  {
    "name": "VEERAMANI",
    "phone": "9659466771"
  },
  {
    "name": "sentamil selvi",
    "phone": "9840271065"
  },
  {
    "name": "kathir",
    "phone": "9578640989"
  },
  {
    "name": "suresh kumar",
    "phone": "9443500828"
  },
  {
    "name": "arun kumar",
    "phone": "7395952100"
  },
  {
    "name": "shanmugam",
    "phone": "9841535840"
  },
  {
    "name": "RAJKUMAR",
    "phone": "9600006759"
  },
  {
    "name": "DEVI",
    "phone": "9894590318"
  },
  {
    "name": "narmadha",
    "phone": "9884445406"
  },
  {
    "name": "balaji",
    "phone": "9952921790"
  },
  {
    "name": "KRISHNAN",
    "phone": "9444798285"
  },
  {
    "name": "sathappan",
    "phone": "8096493894"
  },
  {
    "name": "arul",
    "phone": "9884403438"
  },
  {
    "name": "USHA",
    "phone": "9710324449"
  },
  {
    "name": "MURUGESAN",
    "phone": "9442284929"
  },
  {
    "name": "ashraf ali",
    "phone": "9443331110"
  },
  {
    "name": "ANAND",
    "phone": "9003220900"
  },
  {
    "name": "Thangaraj",
    "phone": "8903518199"
  },
  {
    "name": "leyja",
    "phone": "9789997939"
  },
  {
    "name": "karthik",
    "phone": "7708748123"
  },
  {
    "name": "Nandha",
    "phone": "8939145814"
  },
  {
    "name": "rajendran",
    "phone": "9884263532"
  },
  {
    "name": "BEEN",
    "phone": "9841061336"
  },
  {
    "name": "prakash",
    "phone": "9445125703"
  },
  {
    "name": "suresh",
    "phone": "9176795923"
  },
  {
    "name": "chandrashekar",
    "phone": "9445938434"
  },
  {
    "name": "basha",
    "phone": "9345911220"
  },
  {
    "name": "sekar",
    "phone": "9790816610"
  },
  {
    "name": "MANI",
    "phone": "9444045525"
  },
  {
    "name": "KARTHICK",
    "phone": "9884355170"
  },
  {
    "name": "Velmurugan",
    "phone": "7401114712"
  },
  {
    "name": "jayakumar",
    "phone": "9884866576"
  },
  {
    "name": "DILEEP KUMAR",
    "phone": "8939704187"
  },
  {
    "name": "sekar",
    "phone": "9962062048"
  },
  {
    "name": "Naresh",
    "phone": "9710237809"
  },
  {
    "name": "SAAMINAADHAN",
    "phone": "9486187484"
  },
  {
    "name": "murugan",
    "phone": "9942671354"
  },
  {
    "name": "ramesh",
    "phone": "9176266762"
  },
  {
    "name": "kannyan",
    "phone": "9444705804"
  },
  {
    "name": "Shekar",
    "phone": "9962257804"
  },
  {
    "name": "BOSE",
    "phone": "9444949992"
  },
  {
    "name": "Ramani",
    "phone": "9962564455"
  },
  {
    "name": "daiyanithy",
    "phone": "9941027430"
  },
  {
    "name": "sowndhar",
    "phone": "9884132269"
  },
  {
    "name": "MURUGAN",
    "phone": "9840532930"
  },
  {
    "name": "JEBA",
    "phone": "9042289941"
  },
  {
    "name": "jeevan",
    "phone": "9150166179"
  },
  {
    "name": "Ganesh",
    "phone": "8526134460"
  },
  {
    "name": "NA",
    "phone": "9840328983"
  },
  {
    "name": "narayanan",
    "phone": "9941133407"
  },
  {
    "name": "mari muthu",
    "phone": "9884231135"
  },
  {
    "name": "NAREN",
    "phone": "9941040011"
  },
  {
    "name": "divya",
    "phone": "9597413613"
  },
  {
    "name": "palpandi",
    "phone": "9962376882"
  },
  {
    "name": "suresh",
    "phone": "9940217425"
  },
  {
    "name": "SENTHIL KUMAR",
    "phone": "9840481467"
  },
  {
    "name": "RAJA KUMARI",
    "phone": "9940510982"
  },
  {
    "name": "saravanan",
    "phone": "9894594748"
  },
  {
    "name": "muhammed amim",
    "phone": "9791082685"
  },
  {
    "name": "shankar",
    "phone": "9282131638"
  },
  {
    "name": "RAJKUMAR",
    "phone": "9843069944"
  },
  {
    "name": "BABU",
    "phone": "9789577688"
  },
  {
    "name": "selvam",
    "phone": "9884522861"
  },
  {
    "name": "NA",
    "phone": "9176209869"
  },
  {
    "name": "syed",
    "phone": "9043764795"
  },
  {
    "name": "aravind",
    "phone": "9940411483"
  },
  {
    "name": "PRASANA",
    "phone": "9003391544"
  },
  {
    "name": "mugil vannan",
    "phone": "9445486891"
  },
  {
    "name": "na",
    "phone": "8056256295"
  },
  {
    "name": "MURUGAN",
    "phone": "9786491653"
  },
  {
    "name": "Pavi",
    "phone": "9094692072"
  },
  {
    "name": "balaji",
    "phone": "8072543063"
  },
  {
    "name": "Ramesh",
    "phone": "9840140881"
  },
  {
    "name": "PRABHAKAR",
    "phone": "8610623451"
  },
  {
    "name": "ravi",
    "phone": "9940042915"
  },
  {
    "name": "SIVA KUMAR",
    "phone": "9480700288"
  },
  {
    "name": "raja",
    "phone": "9444090420"
  },
  {
    "name": "BASKARAN",
    "phone": "9444649595"
  },
  {
    "name": "VISWANATHAN",
    "phone": "9940029156"
  },
  {
    "name": "vetrivel",
    "phone": "9941179703"
  },
  {
    "name": "BHAVANI",
    "phone": "9962768095"
  },
  {
    "name": "balasubramanium",
    "phone": "9842892851"
  },
  {
    "name": "selvaraj",
    "phone": "9944429156"
  },
  {
    "name": "surenthiran",
    "phone": "9843743640"
  },
  {
    "name": "dhandapani",
    "phone": "9940221934"
  },
  {
    "name": "kumar",
    "phone": "9444157266"
  },
  {
    "name": "M.S. SHANKAR",
    "phone": "9361165200"
  },
  {
    "name": "ARUN",
    "phone": "8489854467"
  },
  {
    "name": "balu",
    "phone": "9840641857"
  },
  {
    "name": "sathish",
    "phone": "9940518715"
  },
  {
    "name": "kamaraj",
    "phone": "9381124547"
  },
  {
    "name": "murugan",
    "phone": "7397279888"
  },
  {
    "name": "murugan",
    "phone": "9444441385"
  },
  {
    "name": "Manjunath",
    "phone": "7022741069"
  },
  {
    "name": "rajasegar",
    "phone": "9894099877"
  },
  {
    "name": "NARTHANA",
    "phone": "9566108155"
  },
  {
    "name": "venkatesh",
    "phone": "8056251317"
  },
  {
    "name": "DINESH",
    "phone": "7397298299"
  },
  {
    "name": "GEETHA",
    "phone": "9962539444"
  },
  {
    "name": "rajasekar",
    "phone": "9381025364"
  },
  {
    "name": "suresh",
    "phone": "8838597396"
  },
  {
    "name": "BHAKIYA RAJ",
    "phone": "9941107328"
  },
  {
    "name": "gunasekaran",
    "phone": "9941582242"
  },
  {
    "name": "manikandan",
    "phone": "9840202278"
  },
  {
    "name": "mahalakshmi",
    "phone": "9791042133"
  },
  {
    "name": "VISAHL",
    "phone": "9003031972"
  },
  {
    "name": "VIGNESH",
    "phone": "9500350174"
  },
  {
    "name": "Abdul Khader",
    "phone": "9442141584"
  },
  {
    "name": "jamal",
    "phone": "9176376747"
  },
  {
    "name": "karunaneedhi",
    "phone": "9442552942"
  },
  {
    "name": "RAMESH",
    "phone": "9442546927"
  },
  {
    "name": "SATHEESH",
    "phone": "9884084345"
  },
  {
    "name": "NA",
    "phone": "9551229071"
  },
  {
    "name": "subramani",
    "phone": "9500988724"
  },
  {
    "name": "VENKATESAN",
    "phone": "9176067354"
  },
  {
    "name": "SRI KRISHNA",
    "phone": "9952096126"
  },
  {
    "name": "SANGKARAPERUMAL",
    "phone": "9382860582"
  },
  {
    "name": "partha",
    "phone": "9444704316"
  },
  {
    "name": "MADHAN",
    "phone": "9884362652"
  },
  {
    "name": "SARAVANAN",
    "phone": "9865569708"
  },
  {
    "name": "praba",
    "phone": "9094547881"
  },
  {
    "name": "SOUNDARARAJAN",
    "phone": "9976947922"
  },
  {
    "name": "siva mani",
    "phone": "9360504462"
  },
  {
    "name": "ramesh",
    "phone": "9094323917"
  },
  {
    "name": "karthika",
    "phone": "9952707657"
  },
  {
    "name": "Viji",
    "phone": "8778648319"
  },
  {
    "name": "babu",
    "phone": "8939403498"
  },
  {
    "name": "karthik",
    "phone": "8608525879"
  },
  {
    "name": "SUBRAMANIYAM",
    "phone": "9841223949"
  },
  {
    "name": "Stalin",
    "phone": "9710585933"
  },
  {
    "name": "nithya",
    "phone": "9962160466"
  },
  {
    "name": "jaya bal",
    "phone": "9884000473"
  },
  {
    "name": "Na",
    "phone": "9790893474"
  },
  {
    "name": "mohan",
    "phone": "8754401200"
  },
  {
    "name": "Mohamed",
    "phone": "9944250786"
  },
  {
    "name": "kalaiarasi",
    "phone": "9176080783"
  },
  {
    "name": "NA",
    "phone": "8438832780"
  },
  {
    "name": "Mohan",
    "phone": "9741288155"
  },
  {
    "name": "geetha",
    "phone": "7299778891"
  },
  {
    "name": "senivason",
    "phone": "9884997878"
  },
  {
    "name": "BABU",
    "phone": "7397407983"
  },
  {
    "name": "shanthi",
    "phone": "9941249346"
  },
  {
    "name": "MALINI",
    "phone": "9841615520"
  },
  {
    "name": "sathyamoorthy",
    "phone": "9566655454"
  },
  {
    "name": "thinagaran",
    "phone": "9843341656"
  },
  {
    "name": "mohan",
    "phone": "9042960451"
  },
  {
    "name": "jagatheesh",
    "phone": "7904029031"
  },
  {
    "name": "NA",
    "phone": "8682053919"
  },
  {
    "name": "VIKRAM",
    "phone": "9611907867"
  },
  {
    "name": "Vijayan",
    "phone": "8939366197"
  },
  {
    "name": "JEEVA KRISHNAN",
    "phone": "9884121490"
  },
  {
    "name": "deepak",
    "phone": "9444491090"
  },
  {
    "name": "deva",
    "phone": "9092897424"
  },
  {
    "name": "sundarajan",
    "phone": "8939111985"
  },
  {
    "name": "PARTHIBAN",
    "phone": "9841380140"
  },
  {
    "name": "karthik",
    "phone": "9884506193"
  },
  {
    "name": "murugan",
    "phone": "9884933057"
  },
  {
    "name": "varadharajan",
    "phone": "9940221171"
  },
  {
    "name": "MALATHY",
    "phone": "9840888144"
  },
  {
    "name": "JEEVA",
    "phone": "9790954656"
  },
  {
    "name": "raghupathy",
    "phone": "8608006502"
  },
  {
    "name": "MANI",
    "phone": "7358352613"
  },
  {
    "name": "SARAVAN",
    "phone": "9629009093"
  },
  {
    "name": "santhosh",
    "phone": "9994784616"
  },
  {
    "name": "MANIKANDAN",
    "phone": "8939660033"
  },
  {
    "name": "ANANDAVALLI",
    "phone": "9840217907"
  },
  {
    "name": "NA",
    "phone": "9884750626"
  },
  {
    "name": "GOUTHAM",
    "phone": "9962034100"
  },
  {
    "name": "karpagam",
    "phone": "9840073505"
  },
  {
    "name": "Deva",
    "phone": "9578575657"
  },
  {
    "name": "akash",
    "phone": "6374433108"
  },
  {
    "name": "uma",
    "phone": "9994753108"
  },
  {
    "name": "navaneethan krishnan",
    "phone": "9788328889"
  },
  {
    "name": "PADMAVATHI",
    "phone": "9790803384"
  },
  {
    "name": "NAGARAJAN",
    "phone": "9841220554"
  },
  {
    "name": "Sadhasivam",
    "phone": "9444903826"
  },
  {
    "name": "Maniraj",
    "phone": "9025026210"
  },
  {
    "name": "murugasan",
    "phone": "9840703376"
  },
  {
    "name": "raghavan",
    "phone": "8939450357"
  },
  {
    "name": "SEENIVASAN",
    "phone": "9444236463"
  },
  {
    "name": "DHINESH",
    "phone": "9486791165"
  },
  {
    "name": "sasi",
    "phone": "9600046221"
  },
  {
    "name": "ravi kumar",
    "phone": "9444000454"
  },
  {
    "name": "AVINASH",
    "phone": "8122914121"
  },
  {
    "name": "MURUGAN",
    "phone": "9444141073"
  },
  {
    "name": "janoth",
    "phone": "7373647406"
  },
  {
    "name": "na",
    "phone": "8220226490"
  },
  {
    "name": "nagappan",
    "phone": "9500793326"
  },
  {
    "name": "arul kumar",
    "phone": "9884304255"
  },
  {
    "name": "subha santha kumar",
    "phone": "9841552291"
  },
  {
    "name": "Sundar",
    "phone": "9444004444"
  },
  {
    "name": "NAME NOT REVELD",
    "phone": "9944301144"
  },
  {
    "name": "kamalesh",
    "phone": "9444688840"
  },
  {
    "name": "pandiyan",
    "phone": "9444078889"
  },
  {
    "name": "BALASUBRAMANIYAN",
    "phone": "7904217417"
  },
  {
    "name": "PUNNIYAJOTHI",
    "phone": "8098470848"
  },
  {
    "name": "na",
    "phone": "9840553824"
  },
  {
    "name": "BANU",
    "phone": "9043502766"
  },
  {
    "name": "pachiyappan",
    "phone": "9941414334"
  },
  {
    "name": "arun",
    "phone": "9566624701"
  },
  {
    "name": "adhisewaran",
    "phone": "9884179000"
  },
  {
    "name": "VIJAYA",
    "phone": "7823974544"
  },
  {
    "name": "murali",
    "phone": "6380143445"
  },
  {
    "name": "GURUMOORTHY",
    "phone": "7812812381"
  },
  {
    "name": "SIVAKUMAR",
    "phone": "9176056999"
  },
  {
    "name": "thanigai",
    "phone": "9841553827"
  },
  {
    "name": "KANAGARANI",
    "phone": "9841515815"
  },
  {
    "name": "JAWAN",
    "phone": "9176934358"
  },
  {
    "name": "SHAKUL",
    "phone": "9500808671"
  },
  {
    "name": "KALVINATHAN",
    "phone": "9486281217"
  },
  {
    "name": "kumar",
    "phone": "7904550781"
  },
  {
    "name": "Manogaran",
    "phone": "9345136196"
  },
  {
    "name": "muthu krishnan",
    "phone": "9840970314"
  },
  {
    "name": "not revial",
    "phone": "9994989490"
  },
  {
    "name": "suresh",
    "phone": "8438396375"
  },
  {
    "name": "BENJAMIN",
    "phone": "9043508105"
  },
  {
    "name": "SUJATHA",
    "phone": "9790892676"
  },
  {
    "name": "RAM",
    "phone": "9965585989"
  },
  {
    "name": "SAHUL HAMEEDH",
    "phone": "9444171878"
  },
  {
    "name": "ali khan",
    "phone": "8248900602"
  },
  {
    "name": "kottaisami",
    "phone": "9841887377"
  },
  {
    "name": "suresh",
    "phone": "9361812352"
  },
  {
    "name": "NA",
    "phone": "9940468133"
  },
  {
    "name": "DEEPAK",
    "phone": "9791011223"
  },
  {
    "name": "Ravi kumar",
    "phone": "9500166388"
  },
  {
    "name": "lakshmi",
    "phone": "9042920947"
  },
  {
    "name": "PREETHI",
    "phone": "9087204585"
  },
  {
    "name": "rajendharan",
    "phone": "9094060977"
  },
  {
    "name": "suriya",
    "phone": "9840767664"
  },
  {
    "name": "VEL MURUGAN",
    "phone": "9884020571"
  },
  {
    "name": "krishna",
    "phone": "9150273197"
  },
  {
    "name": "VICKY",
    "phone": "9894670349"
  },
  {
    "name": "RAMAR",
    "phone": "9940088848"
  },
  {
    "name": "ravi",
    "phone": "9750054706"
  },
  {
    "name": "GANESAN",
    "phone": "9677211536"
  },
  {
    "name": "saravanan",
    "phone": "9841762657"
  },
  {
    "name": "RANI",
    "phone": "9952915632"
  },
  {
    "name": "MURUGESAN",
    "phone": "9940036464"
  },
  {
    "name": "samvel",
    "phone": "9940059687"
  },
  {
    "name": "alex",
    "phone": "9514769860"
  },
  {
    "name": "murugavel",
    "phone": "9445107297"
  },
  {
    "name": "RAJENDIRAN",
    "phone": "8015333467"
  },
  {
    "name": "larance susira",
    "phone": "9940190025"
  },
  {
    "name": "sinivasan",
    "phone": "9003225335"
  },
  {
    "name": "rajalakshmi",
    "phone": "9444294592"
  },
  {
    "name": "ELUMALAI",
    "phone": "8754071440"
  },
  {
    "name": "dinesh",
    "phone": "7550151661"
  },
  {
    "name": "BALAN",
    "phone": "9791068876"
  },
  {
    "name": "TAMILARASAN",
    "phone": "9962023296"
  },
  {
    "name": "Venkatesan",
    "phone": "9551266626"
  },
  {
    "name": "sekar",
    "phone": "9003979431"
  },
  {
    "name": "Raju",
    "phone": "7401191510"
  },
  {
    "name": "raamasaamy",
    "phone": "9566070910"
  },
  {
    "name": "VENKAT",
    "phone": "9003392613"
  },
  {
    "name": "MANI",
    "phone": "9940261238"
  },
  {
    "name": "BALAJI",
    "phone": "9790192863"
  },
  {
    "name": "Muniraj",
    "phone": "8940636087"
  },
  {
    "name": "Padmavathi",
    "phone": "9841819729"
  },
  {
    "name": "Prabhu naresh",
    "phone": "8056149965"
  },
  {
    "name": "Baskaran",
    "phone": "9840204507"
  },
  {
    "name": "NA",
    "phone": "9791159563"
  },
  {
    "name": "somasundharam",
    "phone": "9342416707"
  },
  {
    "name": "JEGAN",
    "phone": "9445978374"
  },
  {
    "name": "BALA MURUGAN",
    "phone": "9941103891"
  },
  {
    "name": "TAMILMANI",
    "phone": "7708008804"
  },
  {
    "name": "BALA MURUGAN",
    "phone": "9941103891"
  },
  {
    "name": "MURALI",
    "phone": "9841606178"
  },
  {
    "name": "sriram",
    "phone": "9952072003"
  },
  {
    "name": "RAJKUMAR",
    "phone": "9843069944"
  },
  {
    "name": "Srinivasan",
    "phone": "9941464865"
  },
  {
    "name": "RAMALINGAM",
    "phone": "9443051245"
  },
  {
    "name": "MAGESH",
    "phone": "7845634981"
  },
  {
    "name": "harish",
    "phone": "7904638699"
  },
  {
    "name": "Sendhil",
    "phone": "8939791721"
  },
  {
    "name": "NA",
    "phone": "9840630527"
  },
  {
    "name": "aravind",
    "phone": "9940411483"
  },
  {
    "name": "VASUDHEVAN",
    "phone": "9962846551"
  },
  {
    "name": "ragu",
    "phone": "9952946597"
  },
  {
    "name": "SRIDHAR",
    "phone": "9444435897"
  },
  {
    "name": "LAKSHMI",
    "phone": "7092854019"
  },
  {
    "name": "vivek",
    "phone": "9629748702"
  },
  {
    "name": "sugumaaran",
    "phone": "9884018533"
  },
  {
    "name": "SELVARAJ",
    "phone": "9941625643"
  },
  {
    "name": "kumar",
    "phone": "9841489726"
  },
  {
    "name": "santhosh",
    "phone": "9994784616"
  },
  {
    "name": "sivanandham",
    "phone": "9025897685"
  },
  {
    "name": "NA",
    "phone": "9965567544"
  },
  {
    "name": "PATHMA",
    "phone": "9500127678"
  },
  {
    "name": "sugumar",
    "phone": "9710983840"
  },
  {
    "name": "RAGIYA",
    "phone": "8939285429"
  },
  {
    "name": "ranjitha",
    "phone": "7305419203"
  },
  {
    "name": "ANWAR",
    "phone": "9840371112"
  },
  {
    "name": "mahesh",
    "phone": "8825742846"
  },
  {
    "name": "NA",
    "phone": "9840398324"
  },
  {
    "name": "sevam",
    "phone": "9600128603"
  },
  {
    "name": "hari",
    "phone": "9962422461"
  },
  {
    "name": "Manish",
    "phone": "9791007455"
  },
  {
    "name": "panneer selvam",
    "phone": "9677204302"
  },
  {
    "name": "RAJENDRAN",
    "phone": "8438427684"
  },
  {
    "name": "BABU",
    "phone": "9789060619"
  },
  {
    "name": "ELIYAS",
    "phone": "9043164188"
  },
  {
    "name": "sampath kesavan",
    "phone": "9841423059"
  },
  {
    "name": "MANI",
    "phone": "8608280545"
  },
  {
    "name": "THIYAGARAJAN",
    "phone": "9381005419"
  },
  {
    "name": "NA",
    "phone": "9884837108"
  },
  {
    "name": "andrews",
    "phone": "8925302268"
  },
  {
    "name": "Velmurugan",
    "phone": "8939593964"
  },
  {
    "name": "Renuka",
    "phone": "9940166654"
  },
  {
    "name": "MANIMEGALAI",
    "phone": "9025026210"
  },
  {
    "name": "NA",
    "phone": "9486187484"
  },
  {
    "name": "gopi",
    "phone": "9176709058"
  },
  {
    "name": "KRITHIKA",
    "phone": "9840977334"
  },
  {
    "name": "Na",
    "phone": "7010257234"
  },
  {
    "name": "vijaya",
    "phone": "9884230507"
  },
  {
    "name": "babu",
    "phone": "9841966900"
  },
  {
    "name": "jai shankar",
    "phone": "7299691753"
  },
  {
    "name": "anbu",
    "phone": "9965989817"
  }
];

var updateCount = 0;
var errorCount = 0;

// Update passes with visitor data (only add name and phone, keep status as unused)
for (var i = 0; i < Math.min(unusedPasses.length, visitors.length); i++) {
  try {
    var result = db.passes.updateOne(
      {
        _id: unusedPasses[i]._id,
        name: {$exists: false},  // Double check name doesn't exist
        phone: {$exists: false}  // Double check phone doesn't exist
      },
      {$set: {
        name: visitors[i].name,
        phone: visitors[i].phone,
        updatedAt: new Date().toISOString()
        // Note: NOT changing status - keeping as 'unused'
      }}
    );
    
    if (result.modifiedCount > 0) {
      updateCount++;
      if (i % 50 === 0) {
        console.log('Updated', updateCount, 'passes so far...');
      }
    }
  } catch (error) {
    console.log('Error updating pass', unusedPasses[i].passId, ':', error.message);
    errorCount++;
  }
}

console.log('\nUpdate completed:');
console.log('- Successfully updated:', updateCount, 'passes');
console.log('- Errors:', errorCount);

// Verify the updates
var unusedWithData = db.passes.countDocuments({
  status: 'unused',
  name: {$exists: true},
  phone: {$exists: true}
});
console.log('- Unused passes now with visitor data:', unusedWithData);

var totalUnused = db.passes.countDocuments({status: 'unused'});
console.log('- Total unused passes:', totalUnused);
