// CREATE NEW FILE: src/components/drillsheets/InsertDisplay.tsx

import React from 'react';
import { HoleSize, INSERT_MANUFACTURERS } from '../../types/drillsheet'; // UPDATED IMPORT

interface InsertDisplayProps {
    holeSize: HoleSize; // UPDATED TYPE
    fingerName: string;
    className?: string;
}

export const InsertDisplay: React.FC<InsertDisplayProps> = ({
                                                                holeSize,
                                                                fingerName,
                                                                className = ''
                                                            }) => {
    if (!holeSize.hasInsert || !holeSize.insert) {
        return null;
    }

    const { insert } = holeSize;
    const manufacturerInfo = INSERT_MANUFACTURERS[insert.manufacturer];

    return (
        <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
            <div className="flex items-center justify-between mb-2">
                <h6 className="font-medium text-blue-900">
                    {fingerName} Insert
                </h6>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {insert.manufacturer}
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                    <span className="font-medium text-gray-700">Insert Size:</span>
                    <span className="ml-1 text-gray-900">{insert.insertSize}"</span>
                </div>
                <div>
                    <span className="font-medium text-gray-700">Outside Hole:</span>
                    <span className="ml-1 text-gray-900">{insert.outsideHoleSize}"</span>
                </div>

                {insert.type && (
                    <div className="sm:col-span-2">
                        <span className="font-medium text-gray-700">Type:</span>
                        <span className="ml-1 text-gray-900">{insert.type}</span>
                    </div>
                )}

                {insert.color && (
                    <div>
                        <span className="font-medium text-gray-700">Color:</span>
                        <span className="ml-1 text-gray-900">{insert.color}</span>
                    </div>
                )}

                {insert.model && (
                    <div>
                        <span className="font-medium text-gray-700">Model:</span>
                        <span className="ml-1 text-gray-900">{insert.model}</span>
                    </div>
                )}
            </div>

            {insert.notes && (
                <div className="mt-2 text-xs text-gray-600">
                    <span className="font-medium">Notes:</span> {insert.notes}
                </div>
            )}

            <div className="mt-2 text-xs text-gray-500">
                {manufacturerInfo.notes}
            </div>
        </div>
    );
};

interface HoleSpecificationDisplayProps {
    holeSize: HoleSize; // UPDATED TYPE
    fingerName: string;
    pitchForward?: number;
    pitchLateral?: number;
    compact?: boolean;
}

export const HoleSpecificationDisplay: React.FC<HoleSpecificationDisplayProps> = ({
                                                                                      holeSize,
                                                                                      fingerName,
                                                                                      pitchForward,
                                                                                      pitchLateral,
                                                                                      compact = false
                                                                                  }) => {
    if (compact) {
        return (
            <div className="bg-white p-2 rounded border">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="font-medium">{fingerName}:</span>
                        <span className="ml-1">{holeSize.primary}"</span>
                        {holeSize.depth && <span className="text-gray-600 ml-1">({holeSize.depth}" deep)</span>}
                    </div>
                    {holeSize.hasInsert && holeSize.insert && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                            {holeSize.insert.insertSize}" insert
                        </span>
                    )}
                </div>

                {(pitchForward !== undefined || pitchLateral !== undefined) && (
                    <div className="text-xs text-gray-600 mt-1">
                        {pitchForward !== undefined && `F: ${pitchForward}"`}
                        {pitchForward !== undefined && pitchLateral !== undefined && ', '}
                        {pitchLateral !== undefined && `L: ${pitchLateral}"`}
                    </div>
                )}

                {holeSize.hasInsert && holeSize.insert && (
                    <div className="text-xs text-gray-500 mt-1">
                        {holeSize.insert.manufacturer}
                        {holeSize.insert.type && ` ${holeSize.insert.type}`} • {holeSize.insert.outsideHoleSize}" hole
                        {holeSize.insert.color && ` • ${holeSize.insert.color}`}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="bg-white p-3 rounded border">
                <h6 className="font-medium text-gray-900 mb-2">{fingerName} Hole</h6>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                        <span className="font-medium text-gray-700">Size:</span>
                        <span className="ml-1 text-gray-900">{holeSize.primary}"</span>
                    </div>
                    {holeSize.depth && (
                        <div>
                            <span className="font-medium text-gray-700">Depth:</span>
                            <span className="ml-1 text-gray-900">{holeSize.depth}"</span>
                        </div>
                    )}
                    {pitchForward !== undefined && (
                        <div>
                            <span className="font-medium text-gray-700">Forward Pitch:</span>
                            <span className="ml-1 text-gray-900">{pitchForward}"</span>
                        </div>
                    )}
                    {pitchLateral !== undefined && (
                        <div>
                            <span className="font-medium text-gray-700">Lateral Pitch:</span>
                            <span className="ml-1 text-gray-900">{pitchLateral}"</span>
                        </div>
                    )}
                </div>
            </div>

            {holeSize.hasInsert && (
                <InsertDisplay
                    holeSize={holeSize}
                    fingerName={fingerName}
                />
            )}
        </div>
    );
};

interface DrillSheetInsertSummaryProps {
    holes: {
        middle?: { size: HoleSize }; // UPDATED TYPE
        ring?: { size: HoleSize }; // UPDATED TYPE
        index?: { size: HoleSize }; // UPDATED TYPE
        pinky?: { size: HoleSize }; // UPDATED TYPE
    };
}

export const DrillSheetInsertSummary: React.FC<DrillSheetInsertSummaryProps> = ({ holes }) => {
    const insertsUsed = Object.entries(holes)
        .filter(([_, hole]) => hole?.size.hasInsert && hole.size.insert)
        .map(([fingerName, hole]) => ({
            finger: fingerName.charAt(0).toUpperCase() + fingerName.slice(1),
            insert: hole!.size.insert!
        }));

    if (insertsUsed.length === 0) {
        return null;
    }

    return (
        <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Finger Inserts Used
            </h4>
            <div className="space-y-2">
                {insertsUsed.map(({ finger, insert }) => (
                    <div key={finger} className="bg-white p-2 rounded border text-sm">
                        <div className="flex justify-between items-center">
                            <span className="font-medium">{finger}:</span>
                            <span className="text-blue-600">
                                {insert.insertSize}" {insert.manufacturer}
                                {insert.type && ` ${insert.type}`}
                            </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                            Outside hole: {insert.outsideHoleSize}"
                            {insert.color && ` • Color: ${insert.color}`}
                            {insert.model && ` • Model: ${insert.model}`}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};