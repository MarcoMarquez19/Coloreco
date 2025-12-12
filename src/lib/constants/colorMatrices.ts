/**
 * Matrices de confusión de color científicamente precisas para simulación de daltonismo.
 * Basadas en investigaciones de Viénot et al. (1999) y algoritmos de simulación LMS.
 * Diseñadas para ser usadas en filtros SVG <feColorMatrix>.
 */

export const COLOR_MATRICES = {
    // Visión Normal (Identidad)
    none: [
        1, 0, 0, 0, 0,
        0, 1, 0, 0, 0,
        0, 0, 1, 0, 0,
        0, 0, 0, 1, 0
    ],

    // Protanopía (Carencia de sensibilidad al rojo)
    // Los rojos se ven más oscuros y se confunden con verdes.
    protanopia: [
        0.567, 0.433, 0, 0, 0,
        0.558, 0.442, 0, 0, 0,
        0, 0.242, 0.758, 0, 0,
        0, 0, 0, 1, 0
    ],

    // Deuteranopía (Carencia de sensibilidad al verde)
    // Los verdes se confunden con rojos. Es el tipo más común.
    deuteranopia: [
        0.625, 0.375, 0, 0, 0,
        0.7, 0.3, 0, 0, 0,
        0, 0.3, 0.7, 0, 0,
        0, 0, 0, 1, 0
    ],

    // Tritanopía (Carencia de sensibilidad al azul)
    // Los azules se confunden con verdes y los amarillos con violetas.
    tritanopia: [
        0.95, 0.05, 0, 0, 0,
        0, 0.433, 0.567, 0, 0,
        0, 0.475, 0.525, 0, 0,
        0, 0, 0, 1, 0
    ],

    // Acromatopsia (Visión en escala de grises total)
    achromatopsia: [
        0.299, 0.587, 0.114, 0, 0,
        0.299, 0.587, 0.114, 0, 0,
        0.299, 0.587, 0.114, 0, 0,
        0, 0, 0, 1, 0
    ]
};

/**
 * Calcula una matriz intermedia entre la identidad y la matriz de daltonismo
 * basada en la intensidad (0 a 1).
 */
export function interpolateMatrix(type: keyof typeof COLOR_MATRICES, intensity: number): string {
    const matrix = COLOR_MATRICES[type];
    const identity = COLOR_MATRICES.none;
    
    if (!matrix) return identity.join(' ');

    // Interpolación lineal: I + (M - I) * intensity
    const interpolated = identity.map((val, i) => {
        const target = matrix[i];
        return val + (target - val) * intensity;
    });

    return interpolated.join(' ');
}