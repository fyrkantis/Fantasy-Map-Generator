import { describe, it, expect } from 'vitest'
import { connectVertices } from './pathUtils'

describe('Math Operations', () => {
  
  describe('Addition', () => {
    it('should calculate the sum of two positive numbers', () => {
      expect(1 + 1).toBe(2)
    })

    it('should return a negative number when adding two negatives', () => {
      expect(-1 + -1).toBe(-2)
    })
  })

  describe('Multiplication', () => {
    it('should multiply two numbers correctly', () => {
      expect(2 * 3).toBe(6)
    })
  })
})

describe('Connect Vertices', () => {
  
    const vertices1 = {
                    c: [[1,null,null], [2,null,null], [0,null,null]],
                    p: [[0,0], [1,2], [2,0]],
                    v: [[1,null,null], [2,null,null], [0,null,null]]
                }

    const vertices2 = {
                    c: [[1,null,null], [2,null,null], [3,null,null], [4,null,null], [0,null,null]],
                    p: [[0,0], [0,0], [0,0], [0,0], [0,0]],
                    v: [[1,null,null], [2,null,null], [3,null,null], [4,null,null], [0,null,null]],
                }

    const vertices3 = {
                    c: [[1,null,null], [2,5,null], [3,null,null], [4,null,null], [0,null,null], [6,null,null], [0,null,null]],
                    p: [[0,0], [0,0], [0,0],[0,0],[0,0],[0,0],[0,0],],
                    v: [[1,null,null], [2,5,null], [3,null,null], [4,null,null], [0,null,null], [6,null,null], [0,null,null]]
                }
    
    const startingVertex = 0;
    const ofSameType = (cellId: number) => cellId == null;
    //const addToChecked = null

    describe('Basic triangle non-closed', () => {
        it('should give correct non closed brief sequence', () => {

            const out = connectVertices({
                vertices: vertices1,
                startingVertex,
                ofSameType,
                addToChecked: null,
                closeRing: false
            })

            expect(out).toStrictEqual([0,1,2])
        })
    })

    describe('Larger shape with closing', () => {
        it('should return the full circle and end with the starting element', () => {

            const out = connectVertices({
                vertices: vertices2,
                startingVertex,
                ofSameType,
                addToChecked: null,
                closeRing: true
            })

            expect(out).toStrictEqual([0,1,2,3,4,0])
        })
    })

    describe('Multiple possible paths', () => {
        it('Should choose the shorter path through 5, rather than the one through 2', () => {

            const out = connectVertices({
                vertices: vertices3,
                startingVertex,
                ofSameType,
                addToChecked: null,
                closeRing: true
            })

            expect(out).toStrictEqual([0,1,5,6,0])
        })
    })

    describe('Actual addToChecked function', () => {
        it('Should not alter behavior', () => {

            const fun = (cellId: number) => true;

            const out = connectVertices({
                vertices: vertices3,
                startingVertex,
                ofSameType,
                addToChecked: fun,
                closeRing: true
            })

            expect(out).toStrictEqual([0,1,5,6,0])
        })
    })
})