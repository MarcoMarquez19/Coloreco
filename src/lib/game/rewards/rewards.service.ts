/**
 * rewards.service.ts - Sistema de recompensas y logros gamificados
 * 
 * Gestiona puntos, insignias, niveles y desbloqueos para motivar
 * a los usuarios durante las actividades de lectura.
 */

import { writable, get } from 'svelte/store';

export interface Achievement {
	id: string;
	title: string;
	description: string;
	icon: string;
	points: number;
	unlocked: boolean;
	unlockedAt?: Date;
}

export interface UserProgress {
	totalPoints: number;
	level: number;
	achievements: Achievement[];
	currentStreak: number; // días consecutivos
	longestStreak: number;
	activitiesCompleted: number;
}

// Definición de logros disponibles
const ACHIEVEMENTS_CATALOG: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
	{
		id: 'first_read',
		title: 'Primera Lectura',
		description: 'Completaste tu primera actividad de lectura',
		icon: '📖',
		points: 10,
	},
	{
		id: 'speed_reader',
		title: 'Lector Veloz',
		description: 'Completaste 10 actividades',
		icon: '⚡',
		points: 50,
	},
	{
		id: 'persistent',
		title: 'Persistente',
		description: 'Racha de 7 días consecutivos',
		icon: '🔥',
		points: 100,
	},
	{
		id: 'master_reader',
		title: 'Maestro Lector',
		description: 'Alcanzaste el nivel 10',
		icon: '🎓',
		points: 200,
	},
	{
		id: 'bionic_explorer',
		title: 'Explorador Biónico',
		description: 'Usaste lectura biónica por primera vez',
		icon: '🔬',
		points: 20,
	},
	{
		id: 'rhyme_master',
		title: 'Maestro de Rimas',
		description: 'Completaste 5 actividades con rimas',
		icon: '🎵',
		points: 75,
	},
	{
		id: 'pictogram_pro',
		title: 'Profesional de Pictogramas',
		description: 'Usaste pictogramas en 10 actividades',
		icon: '🖼️',
		points: 80,
	},
];

// Store de progreso del usuario
function createProgressStore() {
	const initialProgress: UserProgress = {
		totalPoints: 0,
		level: 1,
		achievements: ACHIEVEMENTS_CATALOG.map((a) => ({
			...a,
			unlocked: false,
		})),
		currentStreak: 0,
		longestStreak: 0,
		activitiesCompleted: 0,
	};

	const { subscribe, set, update } = writable<UserProgress>(initialProgress);

	return {
		subscribe,
		set,
		update,

		/**
		 * Agrega puntos y verifica subida de nivel
		 */
		addPoints: (points: number) => {
			update((progress) => {
				const newPoints = progress.totalPoints + points;
				const newLevel = calculateLevel(newPoints);

				return {
					...progress,
					totalPoints: newPoints,
					level: newLevel,
				};
			});
		},

		/**
		 * Desbloquea un logro
		 */
		unlockAchievement: (achievementId: string): boolean => {
			let wasUnlocked = false;

			update((progress) => {
				const achievement = progress.achievements.find((a) => a.id === achievementId);

				if (achievement && !achievement.unlocked) {
					achievement.unlocked = true;
					achievement.unlockedAt = new Date();
					wasUnlocked = true;

					// Agregar puntos del logro
					return {
						...progress,
						totalPoints: progress.totalPoints + achievement.points,
					};
				}

				return progress;
			});

			return wasUnlocked;
		},

		/**
		 * Incrementa el contador de actividades completadas
		 */
		completeActivity: () => {
			update((progress) => ({
				...progress,
				activitiesCompleted: progress.activitiesCompleted + 1,
			}));
		},

		/**
		 * Actualiza la racha de días
		 */
		updateStreak: (increment: boolean) => {
			update((progress) => {
				const newStreak = increment ? progress.currentStreak + 1 : 1;
				const newLongest = Math.max(newStreak, progress.longestStreak);

				return {
					...progress,
					currentStreak: newStreak,
					longestStreak: newLongest,
				};
			});
		},

		/**
		 * Resetea la racha
		 */
		resetStreak: () => {
			update((progress) => ({
				...progress,
				currentStreak: 0,
			}));
		},

		/**
		 * Carga progreso desde localStorage
		 */
		load: () => {
			if (typeof window !== 'undefined') {
				const saved = localStorage.getItem('coloreco_progress');
				if (saved) {
					try {
						const parsed = JSON.parse(saved);
						set(parsed);
					} catch (e) {
						console.error('Error cargando progreso:', e);
					}
				}
			}
		},

		/**
		 * Guarda progreso en localStorage
		 */
		save: () => {
			if (typeof window !== 'undefined') {
				const current = get({ subscribe });
				localStorage.setItem('coloreco_progress', JSON.stringify(current));
			}
		},
	};
}

/**
 * Calcula el nivel basado en puntos totales
 * Fórmula: nivel = floor(sqrt(puntos / 100)) + 1
 */
function calculateLevel(points: number): number {
	return Math.floor(Math.sqrt(points / 100)) + 1;
}

/**
 * Calcula los puntos necesarios para el siguiente nivel
 */
export function pointsForNextLevel(currentLevel: number): number {
	return Math.pow(currentLevel, 2) * 100;
}

// Store global
export const userProgress = createProgressStore();

// Auto-guardar cuando cambie el progreso
if (typeof window !== 'undefined') {
	userProgress.subscribe(() => {
		userProgress.save();
	});

	// Cargar progreso al iniciar
	userProgress.load();
}

/**
 * Servicio de recompensas - API simplificada
 */
export const rewardsService = {
	/**
	 * Recompensa al usuario por completar una actividad
	 */
	rewardActivity(points: number = 10): void {
		userProgress.addPoints(points);
		userProgress.completeActivity();
	},

	/**
	 * Intenta desbloquear un logro
	 */
	tryUnlockAchievement(achievementId: string): boolean {
		return userProgress.unlockAchievement(achievementId);
	},

	/**
	 * Actualiza la racha diaria
	 */
	checkDailyStreak(): void {
		// Implementar lógica de verificación de fecha
		// Por ahora, simplemente incrementa
		userProgress.updateStreak(true);
	},

	/**
	 * Obtiene los logros desbloqueados
	 */
	getUnlockedAchievements(): Achievement[] {
		const progress = get(userProgress);
		return progress.achievements.filter((a) => a.unlocked);
	},

	/**
	 * Obtiene el progreso actual
	 */
	getProgress(): UserProgress {
		return get(userProgress);
	},
};
