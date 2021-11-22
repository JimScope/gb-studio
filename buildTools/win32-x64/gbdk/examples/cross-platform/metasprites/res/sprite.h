//AUTOGENERATED FILE FROM png2asset
#ifndef METASPRITE_sprite_H
#define METASPRITE_sprite_H

#include <stdint.h>
#include <gbdk/platform.h>

#define sprite_TILE_H 16
#define sprite_WIDTH 64
#define sprite_HEIGHT 48
#define sprite_PIVOT_X 32
#define sprite_PIVOT_Y 24
#define sprite_PIVOT_W 64
#define sprite_PIVOT_H 48

BANKREF_EXTERN(sprite)

extern const uint16_t sprite_palettes[4];
extern const uint8_t sprite_tiles[960];

extern const metasprite_t* const sprite_metasprites[5];

#endif