# Pictogramas / Iconos de Apoyo Visual

Esta carpeta contiene los pictogramas e iconos que se utilizan en el sistema de apoyo visual para facilitar la comprensión lectora.

## Estructura

Los pictogramas deben seguir esta estructura de nombres:

```
[palabra-clave].[extensión]

Ejemplos:
- comer.png
- correr.svg
- casa.png
- pelota.svg
```

## Formatos Recomendados

- **SVG**: Preferido por su escalabilidad sin pérdida de calidad
- **PNG**: Con fondo transparente, mínimo 128x128px

## Cómo Agregar Nuevos Pictogramas

1. **Agregar el archivo de imagen** a esta carpeta con el nombre apropiado
2. **Registrar en el diccionario** editando `src/lib/a11y/pictograms/index.ts`:

```typescript
{
  word: 'nueva-palabra',
  icon: '🎯', // o ruta: '/pictograms/nueva-palabra.png'
  category: 'accion' // categorías: accion, lugar, emocion, color, animal, objeto
}
```

## Categorías Disponibles

- **accion**: Verbos y acciones (comer, correr, jugar)
- **lugar**: Ubicaciones (casa, escuela, parque)
- **emocion**: Sentimientos (feliz, triste, enojado)
- **color**: Colores (rojo, azul, verde)
- **animal**: Animales (perro, gato, pájaro)
- **objeto**: Objetos comunes (lápiz, pelota, libro)

## Recursos de Iconos Gratuitos

- [Flaticon](https://www.flaticon.com/)
- [Freepik](https://www.freepik.com/)
- [ARASAAC](https://arasaac.org/) - Pictogramas específicos para accesibilidad
- [Noun Project](https://thenounproject.com/)

## Notas

- Asegúrate de que las imágenes tengan licencia apropiada para uso comercial
- Mantén un estilo visual consistente entre todos los pictogramas
- Los pictogramas deben ser claros y fácilmente reconocibles por niños
