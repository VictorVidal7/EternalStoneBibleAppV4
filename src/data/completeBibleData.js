export const RV1909 = {
  "Génesis": {
    1: [
      { number: 1, text: "En el principio creó Dios los cielos y la tierra." },
      { number: 2, text: "Y la tierra estaba desordenada y vacía, y las tinieblas estaban sobre la faz del abismo, y el Espíritu de Dios se movía sobre la faz de las aguas." },
      { number: 3, text: "Y dijo Dios: Sea la luz; y fue la luz." },
    ],
    2: [
      { number: 1, text: "Y fueron acabados los cielos y la tierra, y todo su ornamento." },
      { number: 2, text: "Y acabó Dios en el día séptimo la obra que hizo; y reposó el día séptimo de toda la obra que hizo." },
      { number: 3, text: "Y bendijo Dios al día séptimo, y lo santificó, porque en él reposó de toda la obra que había Dios creado y hecho." },
    ],
    3: [
      { number: 1, text: "Pero la serpiente era astuta, más que todos los animales del campo que Jehová Dios había hecho; la cual dijo á la mujer: ¿Conque Dios os ha dicho: No comáis de todo árbol del huerto?" },
    ],
  },
  "Éxodo": {
    1: [
      { number: 1, text: "Estos son los nombres de los hijos de Israel, que entraron en Egipto con Jacob; cada uno entró con su familia." },
    ],
  },
  // ... (más libros del Antiguo Testamento)
  "Mateo": {
    1: [
      { number: 1, text: "Libro de la genealogía de Jesucristo, hijo de David, hijo de Abraham." },
      { number: 2, text: "Abraham engendró a Isaac, e Isaac a Jacob; y Jacob a Judá y a sus hermanos." },
      { number: 3, text: "Y Judá engendró de Tamar a Fares y a Zara: y Fares engendró a Esrom; y Esrom engendró a Aram." },
    ],
  },
  "Marcos": {
    1: [
      { number: 1, text: "Principio del evangelio de Jesucristo, Hijo de Dios." },
    ],
  },
  "Lucas": {
    1: [
      { number: 1, text: "Habiendo muchos tentado a poner en orden la historia de las cosas que entre nosotros han sido ciertísimas," },
    ],
  },
  "Juan": {
    1: [
      { number: 1, text: "En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios." },
    ],
  },
};

// Verificación de la estructura de datos
Object.entries(RV1909).forEach(([book, chapters]) => {
  console.log(`Book: ${book}, Chapters: ${Object.keys(chapters).length}`);
  Object.entries(chapters).forEach(([chapter, verses]) => {
    console.log(`  Chapter ${chapter}: ${verses.length} verses`);
  });
});