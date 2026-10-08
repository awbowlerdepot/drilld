import type { PaperSheetReading } from '../../shared/api/paperReading'

/**
 * A made-up reading of a Motiv sheet, for trying paper import without sign-in
 * (there's no AI reading in mock mode). Not a real bowler.
 */
export const mockPaperReading: PaperSheetReading = {
    template: { brand: 'MOTIV', printed: 'MOTIV BOWLING DRILL SPECS' },
    bowler: { name: 'Pat Example', firstName: 'Pat', lastName: 'Example', phone: null, email: null, date: null },
    hand: 'RIGHT',
    grip: 'FINGERTIP',
    twoHanded: false,
    leftFinger: { inCircle: '7.5', beside: null },
    rightFinger: { inCircle: '5.5', beside: null },
    thumb: { inCircle: '13/16', beside: null },
    bridge: '1/4',
    leftSpan: { value: '4 3/16', annotation: null, alternate: null },
    rightSpan: { value: '4 1/4', annotation: null, alternate: null },
    leftFingerPitch: { reverse: 'X', forward: '1/16', left: '3/8', right: null, up: null, down: null },
    rightFingerPitch: { reverse: '1/8', forward: 'X', left: null, right: '3/8', up: null, down: null },
    thumbPitch: { reverse: '1/8', forward: null, left: 'X', right: '3/16', up: null, down: null },
    oval: { degree: '45°', width: '.060' },
    inserts: { thumb: { style: 'Slug', size: null }, middle: { style: 'Lift', size: null }, ring: { style: 'Lift', size: null } },
    layout: null,
    pap: null,
    ball: { name: null, weight: null, serial: null },
    notes: null,
    corrections: [],
    uncertain: [{ field: 'thumb.inCircle', reason: 'could be 13/16 or 15/16' }]
}
