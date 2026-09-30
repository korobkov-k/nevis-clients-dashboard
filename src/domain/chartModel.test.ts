import { describe, expect, it } from 'vitest';
import { IDS, sourceClients } from '../test/sourceTree';
import { buildChartModel, getReportedTotalMismatch, type ChartModel } from './chartModel';
import { buildClientTree } from './clientTree';

const tree = buildClientTree(sourceClients);

function monthByLabel(model: ChartModel, label: string) {
  const month = model.months.find((candidate) => candidate.label === label);
  if (!month) throw new Error(`Missing month ${label}`);
  return month;
}

describe('buildChartModel', () => {
  describe('Company scope', () => {
    const model = buildChartModel(tree, IDS.company);

    it('stacks the three branches in source order with stable IDs', () => {
      expect(model.kind).toBe('breakdown');
      expect(model.series).toEqual([
        { nodeId: IDS.branch1, name: 'Branch 1', colorIndex: 0 },
        { nodeId: IDS.branch2, name: 'Branch 2', colorIndex: 1 },
        { nodeId: IDS.branch3, name: 'Branch 3', colorIndex: 2 },
      ]);
      expect(model.groupingLabel).toBe('By branch');
      expect(model.path.map((node) => node.name)).toEqual(['Company']);
    });

    it('covers twelve months from Feb 2024 to Jan 2025', () => {
      expect(model.months).toHaveLength(12);
      expect(model.months[0]?.label).toBe('Feb 2024');
      expect(model.months[11]?.label).toBe('Jan 2025');
    });

    it('maps Feb 2024 without a reported-total mismatch', () => {
      const feb = monthByLabel(model, 'Feb 2024');
      expect(feb.values).toEqual([147, 76, 27]);
      expect(feb.stackTotal).toBe(250);
      expect(getReportedTotalMismatch(model, feb)).toBeNull();
    });

    it('keeps the reported May 2024 value independent from the branch sum', () => {
      const may = monthByLabel(model, 'May 2024');
      expect(may.values).toEqual([156, 87, 36]);
      expect(may.stackTotal).toBe(279);
      expect(may.reportedTotal).toBe(301);
      expect(getReportedTotalMismatch(model, may)).toBe(301);
    });

    it('maps Jan 2025', () => {
      const jan = monthByLabel(model, 'Jan 2025');
      expect(jan.values).toEqual([214, 91, 45]);
      expect(jan.stackTotal).toBe(350);
    });

    it('scales Y to the largest stack with integer ticks from zero', () => {
      expect(model.yAxis).toEqual({ max: 400, ticks: [0, 100, 200, 300, 400] });
    });
  });

  describe('Branch 1 scope', () => {
    const model = buildChartModel(tree, IDS.branch1);

    it('stacks the five advisers', () => {
      expect(model.series.map((series) => series.nodeId)).toEqual([
        IDS.anna,
        IDS.james,
        IDS.maria,
        IDS.robert,
        IDS.sarah,
      ]);
      expect(model.groupingLabel).toBe('By adviser');
      expect(model.path.map((node) => node.name)).toEqual(['Company', 'Branch 1']);
    });

    it('maps Aug 2024 with the reported Branch 1 value', () => {
      const aug = monthByLabel(model, 'Aug 2024');
      expect(aug.values).toEqual([38, 16, 51, 58, 53]);
      expect(aug.stackTotal).toBe(216);
      expect(getReportedTotalMismatch(model, aug)).toBe(214);
    });

    it('covers the largest adviser stack, not the smaller reported value', () => {
      expect(model.yAxis.max).toBeGreaterThanOrEqual(216);
      expect(model.yAxis.ticks[0]).toBe(0);
      expect(model.yAxis.ticks.every(Number.isInteger)).toBe(true);
    });
  });

  describe('Anna scope', () => {
    const model = buildChartModel(tree, IDS.anna);

    it('stacks the three acquisition channels', () => {
      expect(model.series.map((series) => series.name)).toEqual([
        'Existing clients',
        'New organic',
        'New paid',
      ]);
      expect(model.series.map((series) => series.colorIndex)).toEqual([0, 1, 2]);
      expect(model.groupingLabel).toBe('By acquisition channel');
      expect(model.path.map((node) => node.name)).toEqual([
        'Company',
        'Branch 1',
        'Anna Blackwood',
      ]);
    });

    it('preserves zero values and both discrepancies', () => {
      const jun = monthByLabel(model, 'Jun 2024');
      expect(jun.values).toEqual([31, 0, 2]);
      expect(jun.stackTotal).toBe(33);
      expect(getReportedTotalMismatch(model, jun)).toBe(32);

      const aug = monthByLabel(model, 'Aug 2024');
      expect(aug.values).toEqual([34, 2, 0]);
      expect(aug.stackTotal).toBe(36);
      expect(getReportedTotalMismatch(model, aug)).toBe(38);
    });

    it('scales Y to 40', () => {
      expect(model.yAxis).toEqual({ max: 40, ticks: [0, 10, 20, 30, 40] });
    });
  });

  describe('leaf scopes', () => {
    it('shows Branch 2 as its own single series without totals', () => {
      const model = buildChartModel(tree, IDS.branch2);
      expect(model.kind).toBe('leaf');
      expect(model.series).toEqual([{ nodeId: IDS.branch2, name: 'Branch 2', colorIndex: 1 }]);
      expect(model.groupingLabel).toBe('Monthly clients');
      expect(model.months[0]?.values).toEqual([76]);
      expect(model.months[11]?.values).toEqual([91]);
      expect(model.months.every((month) => getReportedTotalMismatch(model, month) === null)).toBe(
        true,
      );
    });

    it('shows an existing-clients channel with its sibling colour position', () => {
      const model = buildChartModel(tree, IDS.existingClients);
      expect(model.kind).toBe('leaf');
      expect(model.series).toEqual([
        { nodeId: IDS.existingClients, name: 'Existing clients', colorIndex: 0 },
      ]);
      expect(model.months[0]?.values).toEqual([25]);
      expect(model.months[11]?.values).toEqual([34]);
      expect(model.path.map((node) => node.name)).toEqual([
        'Company',
        'Branch 1',
        'Anna Blackwood',
        'Existing clients',
      ]);
    });

    it('keeps the New paid colour position when it is the selected leaf', () => {
      expect(buildChartModel(tree, IDS.newPaid).series[0]?.colorIndex).toBe(2);
    });
  });

  it('never mixes hierarchy levels in one scope', () => {
    for (const node of tree.nodes.values()) {
      const model = buildChartModel(tree, node.id);
      const levels = new Set(model.series.map((series) => tree.nodes.get(series.nodeId)?.level));
      expect(levels.size).toBe(1);
    }
  });
});
