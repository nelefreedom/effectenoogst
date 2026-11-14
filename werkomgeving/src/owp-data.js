/* Voorbeeldgegevens: de verzonnen coalitie Jong en Zeker, gelijk aan Dashboard De oogst. */
const LAGEN = [null,
  {naam:'Middelen', kort:'Meer of minder middelen', vraag:'Krijgt het systeem meer of minder middelen?', uitleg:'Geld, een extra plek, een vergoeding, een ruimere norm, een kortere termijn. Het systeem doet hetzelfde, met meer of minder. Ook een nieuw getal in een bestaande regel hoort hier.'},
  {naam:'Signalen', kort:'Anders reageren op signalen', vraag:'Reageert het systeem anders op signalen?', uitleg:'Een probleem komt sneller op tafel en er gebeurt iets mee: een vast overleg, een klacht die tot bijsturing leidt. Een partij die al stuurt, krijgt een beter signaal.'},
  {naam:'Spelregels', kort:'Nieuwe spelregels', vraag:'Veranderen de spelregels?', uitleg:'Er komt een nieuwe regel in beleid, een verordening of een plan; een andere partij krijgt voortaan informatie of mag meebeslissen. Het systeem gaat zelf anders werken, vaak ook als de mensen wisselen.'},
  {naam:'Bedoeling', kort:'Een andere bedoeling', vraag:'Verandert de bedoeling?', uitleg:'Een partij stuurt in de praktijk op iets anders dan eerst, of kijkt anders naar de mensen om wie het gaat. Zeldzaam, en het meest waard.'}
];
const LABELS = {
  vermoeden:{naam:'Vermoeden', n:1, uitleg:'Een vondst van AI in documenten, nog door niemand bevestigd.'},
  aanwijzing:{naam:'Aanwijzing', n:2, uitleg:'Eén bron: het eigen verhaal of een eigen document.'},
  onderbouwd:{naam:'Onderbouwd', n:3, uitleg:'Twee bronnen die los van elkaar staan, of een document van de partij zelf.'},
  bevestigd:{naam:'Bevestigd', n:4, uitleg:'De partij die veranderde bevestigt de verandering en de bijdrage.'},
  verschil:{naam:'Bevestigd, met verschil van inzicht', n:4, uitleg:'De verandering klopt; de andere partij weegt de bijdrage anders. Beide lezingen staan naast elkaar.'}
};
const SOORTEN = {vooruit:'Vooruit', terug:'Stap terug', afgewend:'Verslechtering afgewend'};
const VIJF_VRAGEN = [
  {id:'valtop', vraag:'Wat valt op?', hulp:'Eerst alleen kijken. Wat zie je in de oogst, zonder het al te verklaren?'},
  {id:'roept', vraag:'Wat roept het op?', hulp:'Wat verrast, wat stelt teleur, waar word je blij van?'},
  {id:'begrijpen', vraag:'Hoe begrijpen we het?', hulp:'Welke verklaringen zijn er? Wat zegt dit over hoe jullie werken?'},
  {id:'doen', vraag:'Wat doen we ermee?', hulp:'Waar gaat de volgende inzet heen? Waar stoppen we mee?'},
  {id:'weten', vraag:'Wat weten we nog niet?', hulp:'Welke verandering of schakel ontbreekt? Wat willen we navragen?'}
];

function voorbeeld(){
  const nv=(bij,datum,klopt,bijdrage,citaat)=>({status:'ontvangen',bij,datum,klopt,bijdrage,citaat,anders:''});
  return {
    versie:1,
    project:{naam:'Jong en Zeker', ondertitel:'Wat veertien organisaties voor jongvolwassenen in twee jaar in beweging brachten bij gemeenten, het Rijk, een zorgverzekeraar en een woningcorporatie.', periode:'april 2025 tot oktober 2026', wij:'de coalitie', fictief:true},
    volgnr:10,
    veranderingen:[
      {id:1,titel:'Jongerenwerk loopt door na achttien',wie:'Gemeenteraad, gemeente in het zuiden',wanneer:'2025-11',zin:'De gemeenteraad zet € 200.000 extra in de begroting voor jongerenwerk voor jongeren van 18 tot 27.',
       verhaal:'Het jongerenwerk stopte in deze gemeente bij achttien, precies op het moment dat de vragen over wonen en inkomen beginnen. In november 2025 zette de raad € 200.000 extra in de begroting voor jongeren van 18 tot 27. Twee jongeren uit het panel spraken in bij de raadscommissie.',
       betekenis:'Jongeren boven de achttien houden een plek om naartoe te gaan. Het bedrag geldt voor één jaar.',
       bijdrage:'Het lokale netwerk bereidde de twee jongeren voor op het inspreken en leverde de cijfers over uitval na het achttiende jaar.',
       anderen:'De partij van de wethouder had het onderwerp al in haar programma staan.',
       laag:1,label:'bevestigd',soort:'vooruit',bronnen:['Navraag bij de beleidsadviseur jeugd, 02-10-2026','Jaarverslag Jong en Zeker 2025'],bouwtOp:null,herkomst:'document',status:'opgenomen',
       navraag:nv('Beleidsadviseur jeugd van de gemeente','2026-10-02','ja','zo','De inspraak van de twee jongeren was het moment waarop de commissie om ging. Dat het in het partijprogramma stond, hielp daarna bij de dekking.')},
      {id:2,titel:'Verzekeraar vergoedt overbruggingsgesprekken',wie:'Zorgverzekeraar, twee regio\'s',wanneer:'2026-01',zin:'Een zorgverzekeraar vergoedt in twee regio\'s drie gesprekken voor jongeren die van de jeugd-ggz naar de volwassenen-ggz gaan.',
       verhaal:'Tussen de jeugd-ggz en de volwassenen-ggz viel voor jongeren een gat van maanden. Sinds januari 2026 vergoedt een zorgverzekeraar in twee regio\'s drie overbruggingsgesprekken, als proef voor één jaar. De coalitie deelde de uitkomsten van het jongerenpanel: 61 procent had in dat gat geen enkel contact gehad.',
       betekenis:'Jongeren in deze twee regio\'s houden contact met een hulpverlener tijdens de overstap.',
       bijdrage:'De coalitie deelde de cijfers uit het jongerenpanel met de inkoper en bracht drie jongeren met hem in gesprek.',
       anderen:'De verzekeraar had een eigen programma voor overgangszorg en ziet dat als de hoofdoorzaak.',
       laag:1,label:'verschil',soort:'vooruit',bronnen:['Navraag bij de inkoper ggz, 09-10-2026','Notulen coalitieoverleg, 12 maart 2026'],bouwtOp:null,herkomst:'document',status:'opgenomen',
       navraag:nv('Inkoper ggz van de zorgverzekeraar','2026-10-09','ja','anders','De pilot komt uit ons eigen programma overgangszorg. De panelcijfers van de coalitie gebruikten we wel in de interne onderbouwing, en de gesprekken met de drie jongeren hebben indruk gemaakt.')},
      {id:3,titel:'Vaste plek aan tafel bij het ministerie',wie:'Ministerie, landelijk',wanneer:'2025-04',zin:'Het ministerie nodigt de coalitie elk kwartaal uit, vóórdat een Kamerbrief over jongeren geschreven wordt.',
       verhaal:'De coalitie werd af en toe gehoord als er een Kamerbrief aankwam. Sinds april 2025 zit ze elk kwartaal aan tafel bij het ministerie, samen met twee andere jongerenorganisaties, voordat de brief geschreven wordt.',
       betekenis:'Signalen van jongeren komen aan de voorkant binnen. Het is een afspraak; vastgelegd is ze nog niet.',
       bijdrage:'Drie jaar lang dezelfde boodschap, elke keer met nieuwe verhalen uit het jongerenpanel.',
       anderen:'Een Kamerlid vroeg het ministerie waarom jongeren zelf niet aan tafel zaten.',
       laag:2,label:'bevestigd',soort:'vooruit',bronnen:['Navraag bij de senior beleidsmedewerker, 06-10-2026','Jaarverslag Jong en Zeker 2025'],bouwtOp:null,herkomst:'document',status:'opgenomen',
       navraag:nv('Senior beleidsmedewerker van het ministerie','2026-10-06','ja','zo','De vraag van het Kamerlid was de directe aanleiding. Maar dat het de coalitie werd, komt doordat zij al drie jaar bruikbaar materiaal leverde. We wisten wie we moesten bellen.')},
      {id:4,titel:'Binnen tien werkdagen antwoord',wie:'Gemeente in het noorden',wanneer:'2026-07',zin:'Jongeren die bijzondere bijstand aanvragen, horen binnen tien werkdagen of hun aanvraag compleet is.',
       verhaal:'Jongeren die bijzondere bijstand aanvroegen, hoorden soms zes weken niets en gaven het dan op. Sinds juli 2026 laat de gemeente binnen tien werkdagen weten of de aanvraag compleet is. Het is een werkafspraak van de afdeling.',
       betekenis:'Minder jongeren haken af tijdens het wachten.',
       bijdrage:'Het lokale netwerk bracht de wachttijd in bij het wijkoverleg, als grootste ergernis uit het jongerenpanel.',
       anderen:'Een buurgemeente werkte al met deze termijn en diende als voorbeeld.',
       laag:1,label:'aanwijzing',soort:'vooruit',bronnen:['Verteld door de projectleider van het lokale netwerk, 17-09-2026'],bouwtOp:null,herkomst:'team',status:'opgenomen',
       navraag:{status:'verstuurd',bij:'Teamleider inkomen van de gemeente',datum:'2026-10-05',klopt:'',bijdrage:'',citaat:'',anders:''}},
      {id:5,titel:'Vijf procent van de kleine woningen voor jongeren uit de jeugdzorg',wie:'Woningcorporatie in het westen',wanneer:'2025-12',zin:'Een woningcorporatie legt vast dat vijf procent van de vrijkomende kleine woningen naar jongeren uit de jeugdzorg gaat.',
       verhaal:'Een woning voor een jongere uit de jeugdzorg was elke keer een gunst. In het toewijzingsbeleid voor 2026 staat nu dat vijf procent van de vrijkomende kleine woningen naar deze jongeren gaat. Daaraan ging een proef met twaalf woningen vooraf.',
       betekenis:'Een gunst werd een regel. De afspraak staat in het beleid van de corporatie en in de afspraken met de gemeente.',
       bijdrage:'De jeugdzorgaanbieder uit de coalitie draaide de proef met twaalf woningen en begeleidde de jongeren.',
       anderen:'De gemeente zette de afspraak in de prestatieafspraken met de corporatie.',
       laag:3,label:'bevestigd',soort:'vooruit',bronnen:['Navraag bij de manager wonen, 08-10-2026','Toewijzingsbeleid 2026, paragraaf 4.3'],bouwtOp:null,herkomst:'document',status:'opgenomen',
       navraag:nv('Manager wonen van de woningcorporatie','2026-10-08','ja','zo','Zonder de proef hadden we dit niet in het beleid gezet. De begeleiding maakte het verschil: geen overlast, geen huurachterstand.')},
      {id:6,titel:'Jongerenpanel krijgt adviesrecht',wie:'Gemeenteraad, gemeente in het zuiden',wanneer:'2026-03',zin:'De gemeente neemt het jongerenpanel op in de verordening: het panel adviseert bij nieuw beleid over jeugd en Wmo.',
       verhaal:'Na het inspreken bij de begroting wilde de wethouder de stem van jongeren een vaste plek geven. In maart 2026 nam de raad het jongerenpanel op in de inspraakverordening. Het panel adviseert voortaan bij nieuw beleid over jeugd en maatschappelijke ondersteuning.',
       betekenis:'Jongeren hebben een vaste plek in de besluitvorming. Die blijft, ook na een nieuwe wethouder.',
       bijdrage:'Het lokale netwerk organiseerde het inspreken en schreef met de griffie een voorbeeldtekst voor de verordening.',
       anderen:'Een tweede lid van de coalitie dacht mee in de klankbordgroep.',
       laag:3,label:'bevestigd',soort:'vooruit',bronnen:['Navraag bij de wethouder jeugd, 13-10-2026','Inspraakverordening 2026, artikel 7'],bouwtOp:1,herkomst:'document',status:'opgenomen',
       navraag:nv('Wethouder jeugd','2026-10-13','ja','zo','Het inspreken bij de begroting liet zien wat jongeren toevoegen. Daarna wilde ik dat een vaste plek geven. De tekst van het netwerk hebben we bijna letterlijk overgenomen.')},
      {id:7,titel:'Kamer vraagt om een jongerentoets',wie:'Tweede Kamer',wanneer:'2026-06',zin:'De Tweede Kamer neemt een motie aan: bij nieuw beleid moet het kabinet nagaan wat het betekent voor jongeren van 16 tot 27.',
       verhaal:'Op 24 juni 2026 nam de Tweede Kamer een motie aan die het kabinet vraagt om een jongerentoets. Bij nieuw beleid wordt dan nagegaan wat het betekent voor jongeren van 16 tot 27. De tekst van de toets was eerst besproken in het kwartaaloverleg met het ministerie.',
       betekenis:'Een Kamermeerderheid vraagt om een vaste toets. Hoe het kabinet de motie uitvoert, wordt in 2027 duidelijk.',
       bijdrage:'De coalitie stelde met twee andere organisaties de tekst van de toets op en stuurde die aan drie fracties.',
       anderen:'Het Kamerlid dat de motie indiende, noemde de jongerentoets al in 2024.',
       laag:3,label:'verschil',soort:'vooruit',bronnen:['Navraag bij de beleidsmedewerker van het Kamerlid, 14-10-2026','Motietekst en stemmingsuitslag, 24-06-2026'],bouwtOp:3,herkomst:'document',status:'opgenomen',
       navraag:nv('Beleidsmedewerker van het Kamerlid','2026-10-14','ja','anders','De tekst kwam grotendeels van de coalitie en haar partners. Het Kamerlid had de jongerentoets al in 2024 genoemd. De verhalen uit het panel maakten het debat concreet.')},
      {id:8,titel:'Van 18 naar 27 wordt het uitgangspunt',wie:'Ministerie, landelijk',wanneer:'2026-09',zin:'In de nieuwe beleidsnota loopt ondersteuning door tot 27 jaar. De grens van achttien is als uitgangspunt losgelaten.',
       verhaal:'Hulp en ondersteuning hielden op bij achttien. In de beleidsnota over jongvolwassenen van september 2026 staat een ander uitgangspunt: ondersteuning loopt door tot 27. Het ministerie noemt het \'van 18 naar 27\', de woorden die de coalitie sinds 2022 gebruikt. Het ministerie toetst nieuwe regelingen sindsdien aan die grens.',
       betekenis:'De kijk op de leeftijdsgrens verandert in het beleid zelf. Regels en geld volgen daarna.',
       bijdrage:'Vier jaar lang dezelfde term, in elke inbreng, onderbouwd met onderzoek en verhalen van jongeren.',
       anderen:'De Raad voor Volksgezondheid en Samenleving adviseerde in 2025 in dezelfde richting; het ministerie ziet dat advies als hoofdoorzaak.',
       laag:4,label:'verschil',soort:'vooruit',bronnen:['Navraag bij de directeur, 16-10-2026','Beleidsnota jongvolwassenen, hoofdstuk 2'],bouwtOp:null,herkomst:'document',status:'opgenomen',
       navraag:nv('Directeur bij het ministerie','2026-10-16','ja','anders','Het advies van de raad gaf ons de ruimte om de grens los te laten. Dat we het \'van achttien naar zevenentwintig\' noemen, komt wel van de coalitie. Die term zat al in ieders hoofd.')},
      {id:9,titel:'Subsidie voor de inloop geschrapt',wie:'Gemeente in het oosten',wanneer:'2026-01',zin:'Een gemeente stopt de subsidie van € 40.000 voor een inloop voor jongvolwassenen. De inloop gaat van vijf naar twee dagdelen.',
       verhaal:'Per 1 januari 2026 stopte een gemeente de subsidie van € 40.000 voor een inloop voor jongvolwassenen. De inloop draait nu twee dagdelen per week op vrijwilligers; dat waren er vijf. Een petitie met achthonderd handtekeningen en twee gesprekken met de wethouder konden de bezuiniging niet keren.',
       betekenis:'Minder plek voor jongeren zonder dagbesteding. Deze stap terug laat zien waar de grens van de lobby lag.',
       bijdrage:'Het lokale netwerk voerde een petitie, sprak in en leverde bezoekerscijfers.',
       anderen:'De gemeente moest dertig procent besparen op het totaal aan subsidies in het sociaal domein; deze subsidie verviel daarbij helemaal.',
       laag:1,label:'bevestigd',soort:'terug',bronnen:['Navraag bij de beleidsmedewerker sociaal domein, 07-10-2026','Notulen coalitieoverleg, 12 maart 2026'],bouwtOp:null,herkomst:'document',status:'opgenomen',
       navraag:nv('Beleidsmedewerker sociaal domein van de gemeente','2026-10-07','ja','zo','De petitie heeft de raad niet van gedachten doen veranderen. De taakstelling was dertig procent op alle subsidies. Wel is afgesproken dat de inloop in 2027 opnieuw op de agenda komt.')},
      {id:10,titel:'Vergoeding voor ervaringsdeskundigen blijft',wie:'Zorgverzekeraar, regio west',wanneer:'2026-09',zin:'Een zorgverzekeraar wilde de vergoeding voor ervaringsdeskundigen stoppen en verlengt die nu met een jaar.',
       verhaal:'De zorgverzekeraar wilde de vergoeding voor ervaringsdeskundigen in de overgangszorg per 2027 stoppen. Na drie gesprekken, waarin ook twee jongeren hun verhaal deden, is de vergoeding met een jaar verlengd. De verlenging staat in een brief van de verzekeraar.',
       betekenis:'Een verslechtering bleef uit. Ervaringsdeskundigen blijven een jaar langer beschikbaar voor jongeren in de overstap.',
       bijdrage:'De jeugdzorgaanbieder voerde drie gesprekken met de verzekeraar en nam twee jongeren mee.',
       anderen:'De proef in de andere regio liep goed; dat woog bij de verzekeraar mee.',
       laag:1,label:'onderbouwd',soort:'afgewend',bronnen:['Verteld door de bestuurssecretaris van de jeugdzorgaanbieder, 24-09-2026','Brief van de verzekeraar over de verlenging, september 2026'],bouwtOp:null,herkomst:'team',status:'opgenomen',
       navraag:{status:'geen',bij:'Inkoper ggz van de zorgverzekeraar',datum:'',klopt:'',bijdrage:'',citaat:'',anders:''}}
    ],
    documenten:[
      {id:'d1',titel:'Jaarverslag Jong en Zeker 2025',soort:'Jaarverslag',datum:'2026-02',omvang:'48 pagina\'s',gelezen:true,vondsten:3},
      {id:'d2',titel:'Notulen coalitieoverleg, 12 maart 2026',soort:'Notulen',datum:'2026-03',omvang:'9 pagina\'s',gelezen:true,vondsten:3},
      {id:'d3',titel:'Kamerstukken en moties over jongvolwassenen, 2026',soort:'Kamerstukken',datum:'2026-09',omvang:'14 documenten',gelezen:true,vondsten:2},
      {id:'d4',titel:'Nieuwsbrief Jong en Zeker, oktober 2026',soort:'Nieuwsbrief',datum:'2026-10',omvang:'5 berichten',gelezen:false,vondsten:0,
       alineas:[
        {kop:'Werkconferentie Van 18 naar 27',tekst:'Op 9 oktober kwamen 120 beleidsmakers, jongeren en hulpverleners bijeen in Utrecht. In zes werksessies deelden jongeren hun ervaringen met de overgang naar volwassenheid.',
         oordeel:'activiteit',uitleg:'Dit is een activiteit van de coalitie zelf. Er staat niet wat een ander daarna anders ging doen. Geen verandering.'},
        {kop:'Regio Midden neemt de overgang op in de inkoop',tekst:'Twee samenwerkende gemeenten in het midden van het land hebben in september het nieuwe inkoopkader jeugdhulp vastgesteld. Aanbieders moeten voortaan voor elke jongere vanaf zestien en een half een toekomstplan maken, samen met de jongere. De tekst van die eis komt uit de handreiking die onze werkgroep vorig jaar schreef.',
         oordeel:'nieuw',uitleg:'Twee gemeenten leggen een nieuwe eis vast in hun inkoopkader. Dat is een verandering bij een ander, met een aanwijzing voor de bijdrage.',
         vondst:{titel:'Twee gemeenten eisen een toekomstplan vanaf zestien en een half',wie:'Twee samenwerkende gemeenten, regio midden',wanneer:'2026-09',zin:'Twee gemeenten nemen in het inkoopkader jeugdhulp op dat aanbieders voor elke jongere vanaf zestien en een half een toekomstplan maken, samen met de jongere.',
           verhaal:'In september 2026 stelden twee samenwerkende gemeenten in het midden van het land hun nieuwe inkoopkader jeugdhulp vast. Aanbieders moeten voortaan voor elke jongere vanaf zestien en een half een toekomstplan maken, samen met de jongere.',
           betekenis:'De voorbereiding op achttien wordt een eis aan elke aanbieder, in plaats van iets wat van de hulpverlener afhangt.',
           bijdrage:'De werkgroep van de coalitie schreef de handreiking waaruit de tekst van de eis komt.',anderen:'Nog niet bekend.',laag:3,soort:'vooruit',bouwtOp:null,
           waarom:'Een nieuwe regel in een inkoopkader: voorstel is spelregels.'}},
        {kop:'Een jongerenregisseur in het westen',tekst:'De gemeente waar onze proef met twaalf woningen liep, heeft per 1 oktober een jongerenregisseur aangesteld voor jongeren van 16 tot 27. De wethouder noemde bij de aankondiging de ervaringen uit de woonproef.',
         oordeel:'nieuw',uitleg:'Een gemeente stelt een nieuwe functie in. De wethouder verwijst naar de woonproef: mogelijk een vervolg op een verandering die al in de oogst staat.',
         vondst:{titel:'Gemeente stelt een jongerenregisseur aan',wie:'Gemeente in het westen',wanneer:'2026-10',zin:'De gemeente stelt per 1 oktober 2026 een jongerenregisseur aan voor jongeren van 16 tot 27.',
           verhaal:'De gemeente waar de proef met twaalf woningen liep, heeft per 1 oktober 2026 een jongerenregisseur aangesteld voor jongeren van 16 tot 27. De wethouder noemde bij de aankondiging de ervaringen uit de woonproef.',
           betekenis:'Jongeren in deze gemeente krijgen één aanspreekpunt voor wonen, inkomen en zorg.',
           bijdrage:'De woonproef van de jeugdzorgaanbieder uit de coalitie liet zien wat begeleiding oplevert; de wethouder verwees ernaar.',anderen:'Nog niet bekend.',laag:1,soort:'vooruit',bouwtOp:5,
           waarom:'Extra capaciteit binnen de bestaande werkwijze: voorstel is middelen. Mogelijk een vervolg op verandering 5.'}},
        {kop:'Tien werkdagen: nu ook op de website',tekst:'De gemeente in het noorden heeft de termijn van tien werkdagen voor een reactie op een aanvraag bijzondere bijstand nu ook op haar website gezet.',
         oordeel:'bekend',uitleg:'Deze verandering staat al in de oogst (verandering 4). De website van de gemeente is een tweede bron, van de partij zelf.',bijVerandering:4,bron:'Website van de gemeente, genoemd in de nieuwsbrief van oktober 2026'},
        {kop:'Oproep',tekst:'Ken je een jongere die wil meepraten in het panel? Aanmelden kan tot 1 december.',
         oordeel:'niets',uitleg:'Een oproep. Geen verandering.'}
       ]}
    ],
    aannames:[
      {id:'a1',tekst:'Als jongeren zelf hun verhaal doen, bewegen beslissers eerder.',oordeel:'houdt',toelichting:'In acht van de tien veranderingen speelt het verhaal van jongeren zelf een rol.'},
      {id:'a2',tekst:'Een petitie zet een gemeenteraad onder druk.',oordeel:'anders',toelichting:'Achthonderd handtekeningen keerden de bezuiniging op de inloop niet.'},
      {id:'a3',tekst:'Landelijke regels volgen op lokale voorbeelden.',oordeel:'',toelichting:''},
      {id:'a4',tekst:'Cijfers uit het jongerenpanel overtuigen financiers en verzekeraars.',oordeel:'',toelichting:''}
    ],
    duiding:{valtop:'',roept:'',begrijpen:'',doen:'',weten:''},
    besluiten:[]
  };
}
function leeg(naam){
  return {versie:1,project:{naam:naam||'Onze oogst',ondertitel:'',periode:'',wij:'wij',fictief:false},volgnr:0,veranderingen:[],documenten:[],aannames:[],duiding:{valtop:'',roept:'',begrijpen:'',doen:'',weten:''},besluiten:[]};
}
