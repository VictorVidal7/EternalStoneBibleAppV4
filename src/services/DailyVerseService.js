import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRandomVerse } from '../data/bibleVerses';

class DailyVerseService {
  async getDailyVerse() {
    try {
      const today = new Date().toDateString();
      const storedVerse = await AsyncStorage.getItem('dailyVerse');
      
      if (storedVerse) {
        const { date, verse } = JSON.parse(storedVerse);
        if (date === today) {
          return verse;
        }
      }

      const newVerse = this.generateDailyVerse();
      await this.storeDailyVerse(today, newVerse);
      return newVerse;
    } catch (error) {
      console.error('Error al obtener el versículo diario:', error);
      return this.generateDailyVerse();
    }
  }

  generateDailyVerse() {
    // Por ahora, usamos un versículo aleatorio
    return getRandomVerse();
  }

  async storeDailyVerse(date, verse) {
    try {
      await AsyncStorage.setItem('dailyVerse', JSON.stringify({ date, verse }));
    } catch (error) {
      console.error('Error al almacenar el versículo diario:', error);
    }
  }
}

export default new DailyVerseService();