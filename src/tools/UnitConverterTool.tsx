import React, { useState, useMemo } from 'react';
import { Language } from '../types';
import { getTranslation } from '../i18n';
import { ArrowRightLeft, ShieldCheck, Ruler, Scale, HardDrive, Thermometer, Gauge } from 'lucide-react';

interface UnitConverterToolProps {
  lang: Language;
}

type UnitCategory = 'length' | 'weight' | 'storage' | 'temperature' | 'speed';

export const UnitConverterTool: React.FC<UnitConverterToolProps> = ({ lang }) => {
  const [category, setCategory] = useState<UnitCategory>('length');
  const [inputValue, setInputValue] = useState<string>('100');
  const [fromUnit, setFromUnit] = useState<string>('meter');
  const [toUnit, setToUnit] = useState<string>('foot');

  // Definitions for categories and conversion factors to standard SI base
  const categoriesData = {
    length: {
      icon: Ruler,
      name: lang === 'es' ? 'Longitud' : 'Length',
      base: 'meter',
      units: [
        { id: 'millimeter', name: lang === 'es' ? 'Milímetros (mm)' : 'Millimeters (mm)', factor: 0.001 },
        { id: 'centimeter', name: lang === 'es' ? 'Centímetros (cm)' : 'Centimeters (cm)', factor: 0.01 },
        { id: 'meter', name: lang === 'es' ? 'Metros (m)' : 'Meters (m)', factor: 1 },
        { id: 'kilometer', name: lang === 'es' ? 'Kilómetros (km)' : 'Kilometers (km)', factor: 1000 },
        { id: 'inch', name: lang === 'es' ? 'Pulgadas (in)' : 'Inches (in)', factor: 0.0254 },
        { id: 'foot', name: lang === 'es' ? 'Pies (ft)' : 'Feet (ft)', factor: 0.3048 },
        { id: 'yard', name: lang === 'es' ? 'Yardas (yd)' : 'Yards (yd)', factor: 0.9144 },
        { id: 'mile', name: lang === 'es' ? 'Millas (mi)' : 'Miles (mi)', factor: 1609.344 },
      ]
    },
    weight: {
      icon: Scale,
      name: lang === 'es' ? 'Masa y Peso' : 'Weight & Mass',
      base: 'kilogram',
      units: [
        { id: 'milligram', name: lang === 'es' ? 'Miligramos (mg)' : 'Milligrams (mg)', factor: 0.000001 },
        { id: 'gram', name: lang === 'es' ? 'Gramos (g)' : 'Grams (g)', factor: 0.001 },
        { id: 'kilogram', name: lang === 'es' ? 'Kilogramos (kg)' : 'Kilograms (kg)', factor: 1 },
        { id: 'metric_ton', name: lang === 'es' ? 'Toneladas (t)' : 'Metric Tons (t)', factor: 1000 },
        { id: 'ounce', name: lang === 'es' ? 'Onzas (oz)' : 'Ounces (oz)', factor: 0.0283495 },
        { id: 'pound', name: lang === 'es' ? 'Libras (lb)' : 'Pounds (lb)', factor: 0.453592 },
      ]
    },
    storage: {
      icon: HardDrive,
      name: lang === 'es' ? 'Almacenamiento Digital' : 'Digital Storage',
      base: 'byte',
      units: [
        { id: 'bit', name: 'Bits (b)', factor: 0.125 },
        { id: 'byte', name: 'Bytes (B)', factor: 1 },
        { id: 'kilobyte', name: 'Kilobytes (KB)', factor: 1024 },
        { id: 'megabyte', name: 'Megabytes (MB)', factor: 1048576 },
        { id: 'gigabyte', name: 'Gigabytes (GB)', factor: 1073741824 },
        { id: 'terabyte', name: 'Terabytes (TB)', factor: 1099511627776 },
      ]
    },
    temperature: {
      icon: Thermometer,
      name: lang === 'es' ? 'Temperatura' : 'Temperature',
      base: 'celsius',
      units: [
        { id: 'celsius', name: 'Celsius (°C)' },
        { id: 'fahrenheit', name: 'Fahrenheit (°F)' },
        { id: 'kelvin', name: 'Kelvin (K)' },
      ]
    },
    speed: {
      icon: Gauge,
      name: lang === 'es' ? 'Velocidad' : 'Speed',
      base: 'mps',
      units: [
        { id: 'mps', name: 'Metros por segundo (m/s)', factor: 1 },
        { id: 'kph', name: 'Kilómetros por hora (km/h)', factor: 0.277778 },
        { id: 'mph', name: 'Millas por hora (mph)', factor: 0.44704 },
        { id: 'knot', name: lang === 'es' ? 'Nudos (kn)' : 'Knots (kn)', factor: 0.514444 },
      ]
    }
  };

  const handleCategorySwitch = (cat: UnitCategory) => {
    setCategory(cat);
    if (cat === 'length') { setFromUnit('meter'); setToUnit('foot'); }
    else if (cat === 'weight') { setFromUnit('kilogram'); setToUnit('pound'); }
    else if (cat === 'storage') { setFromUnit('gigabyte'); setToUnit('megabyte'); }
    else if (cat === 'temperature') { setFromUnit('celsius'); setToUnit('fahrenheit'); }
    else if (cat === 'speed') { setFromUnit('kph'); setToUnit('mph'); }
  };

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  // Convert calculation
  const convertedResult = useMemo(() => {
    const val = parseFloat(inputValue);
    if (isNaN(val)) return '0';

    if (category === 'temperature') {
      let celsiusVal = val;
      if (fromUnit === 'fahrenheit') celsiusVal = (val - 32) * (5 / 9);
      else if (fromUnit === 'kelvin') celsiusVal = val - 273.15;

      let targetVal = celsiusVal;
      if (toUnit === 'fahrenheit') targetVal = celsiusVal * (9 / 5) + 32;
      else if (toUnit === 'kelvin') targetVal = celsiusVal + 273.15;

      return targetVal.toFixed(2);
    }

    const currentCat = categoriesData[category] as any;
    const fromDef = currentCat.units.find((u: any) => u.id === fromUnit);
    const toDef = currentCat.units.find((u: any) => u.id === toUnit);

    if (!fromDef || !toDef) return '0';

    const baseValue = val * fromDef.factor;
    const finalValue = baseValue / toDef.factor;

    // Formatting precision
    if (Math.abs(finalValue) < 0.0001 && finalValue !== 0) {
      return finalValue.toExponential(4);
    }
    return parseFloat(finalValue.toFixed(6)).toString();
  }, [category, inputValue, fromUnit, toUnit]);

  return (
    <div className="p-6 sm:p-10">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'es' ? 'Cálculo matemático preciso e instantáneo' : 'Instant high-precision calculation'}</span>
        </div>
        <span className="text-xs text-slate-400">{categoriesData[category].name}</span>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {(Object.keys(categoriesData) as UnitCategory[]).map((catKey) => {
          const cat = categoriesData[catKey];
          const Icon = cat.icon;
          const isSelected = category === catKey;

          return (
            <button
              key={catKey}
              onClick={() => handleCategorySwitch(catKey)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Converter Panel */}
      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          
          {/* From Unit */}
          <div className="md:col-span-5 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              {lang === 'es' ? 'De:' : 'From:'}
            </label>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-lg font-bold text-slate-900 dark:text-white"
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              {categoriesData[category].units.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center pt-4 md:pt-6">
            <button
              onClick={swapUnits}
              className="p-3 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 text-slate-600 dark:text-slate-300 hover:text-blue-600 shadow-sm transition-transform active:rotate-180 cursor-pointer"
              title="Invertir unidades"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* To Unit */}
          <div className="md:col-span-5 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              {lang === 'es' ? 'A (Resultado):' : 'To (Result):'}
            </label>
            <div className="w-full px-4 py-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 font-mono text-lg font-extrabold text-blue-600 dark:text-blue-400 select-all">
              {convertedResult}
            </div>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              {categoriesData[category].units.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
