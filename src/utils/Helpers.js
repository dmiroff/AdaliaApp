const classDataToDict = (classData) => {
    const dict = {};
    Object.keys(classData).forEach(key => {
      dict[key] = classData[key];
    });
    return dict;
  };

export default classDataToDict;

export const dict_translator = {
  "sign_affected": "Влияет на",
  "rating_snow": "Снежков",
  "type": "Тип",
  "weapon_damage": "Урон",
  "buff_ally": "Поддержка",
  "text": "Описание",
  "weapon_damage_type": "Тип урона",
  "attack_cost": "Стоимость атаки",
  "attack_range": "Дальность атаки",
  "value": "Цена",
  "weight": "Вес",
  "attacks": "Атаки",
  "max_charges": "Заряды",
  "is_equippable": "Можно надеть",
  "skill": "Навык",
  "enchant_damage": "Усиление урона",
  "enchant_damage_type": "Вид доб. урона",
  "crit_chance": "Шанс крит. удара",
  "2handed": "Двуручный",
  "add_damage_multiplicator": "Мульт. доб. урона",
  "defence": "Класс защиты",
  "piercing_deduction": "Вычет колющего",
  "bludge_deduction": "Вычет дробящего",
  "slashing_deduction": "Вычет рубящего",
  "fire_deduction": "Вычет огненного",
  "electric_deduction": "Вычет молнией",
  "ice_deduction": "Вычет ледяного",
  "sound_deduction": "Вычет звукового",
  "wind_deduction": "Вычет воздушного",
  "mind_deduction": "Вычет мыслью",
  "light_deduction": "Вычет светом",
  "dark_deduction": "Вычет тьмой",
  "life_deduction": "Вычет жизнью",
  "death_deduction": "Вычет смертью",
  "piercing": "Колющий",
  "bludge": "Дробящий",
  "slashing": "Рубящий",
  "fire": "Огненный",
  "electric": "Электрический",
  "ice": "Ледяной",
  "sound": "Звуковой",
  "wind": "Воздушный",
  "mind": "Урон мысли",
  "sheak_check": "Мод. скрытности",
  "supplies_on_cook": "Припасы при готовке",
  "healing": "Лечение",
  "food": "Еда",
  "supplies": "Расходник",
  "potions": "Зелье",
  "breast_armor": "Доспех",
  "left_hand": "Левая рука",
  "right_hand": "Оружие",
  "head": "Шлем",
  "cloak": "Плащ",
  "ring_1": "Кольцо1",
  "ring_2": "Кольцо2",
  "ring_3": "Кольцо3",
  "ring_4": "Кольцо4",
  "ring_5": "Кольцо5",
  "gloves": "Перчатки",
  "necklace": "Амулет",
  "leg_armor": "Поножи",
  "boots": "Обувь",
  "belt": "Пояс",
  False: "Нет",
  True: "Да",
  "true": "Да",
  "false": "Нет",
  "knifes": "Кинжалы",
  "swords": "Мечи",
  "axes": "Топоры",
  "hammers": "Молоты",
  "spears": "Копья",
  "staffs": "Посохи",
  "bows": "Луки",
  "crossbows": "Арбалеты",
  "throwing weapon": "Метательное",
  "shield": "Щиты",
  "available_signs": "Доступные к изучению знаки",
  "prepared_magic": "Подготовленные заклинания",
  "magic_attack": "Маг. атака",
  "magic_damage": "Маг. урон",
  "pray_attack": "Атака духа",
  "pray_damage": "Урон духа",
  "sign_fire": "Огонь",
  "sign_ice": "Лёд",
  "sign_electric": "Электричество",
  "sign_wind": "Ветер",
  "sign_stone": "Камень",
  "sign_power": "Власть",
  "sign_sound": "Звук",
  "sign_light": "Свет",
  "sign_dark": "Тьма",
  "sign_life": "Жизнь",
  "sign_death": "Смерть",
  "sign_touch": "Длань",
  "sign_distant": "Сгусток",
  "sign_ray": "Поток",
  "sign_weapon_enchant": "Улучшение оружия",
  "sign_armor_enchant": "Сфера",
  "sign_dash": "Рывок",
  "dash": "Рывок",
  "sign_magic_effect": "Аугментация Мощи",
  "sign_magic_accuracy": "Аугментация Точности",
  "sign_magic_range": "Аугментация Дальности",
  "scroll": "Свиток",
  "reagent": "Реагент",
  "junk": "Хлам",
  "sneak_check": "Мод. проверок скрытности",
  "ranged_weapon": "Оружие дальнего боя",
  "ammo": "Боеприпас",
  "sign": "Знак",
  "reload_cost": "Стоимость перезарядки",
  "ready_to_fire": "Заряжен",
  "name": "Имя",
  "damage": "Урон",
  "arm_armor": "Наручи",
  "ring": "Кольцо",
  "current_action_points": "Текущие ОД",
  "parry": "Парирование",
  "consumable_items": "Расходуемые предметы",
  "current_health": "Текущее здоровье",
  "No": "Нет",
  "Fighter": "Воин",
  "required_class": "Требуемый класс",
  "agility": "Ловкость",
  "strength": "Сила",
  "perception": "Восприятие",
  "constitution": "Выносливость",
  "intelligence": "Интеллект",
  "wisdom": "Мудрость",
  "charisma": "Харизма",
  "luck": "Удача",
  "initiative": "Инициатива",
  "rage": "Ярость",
  "bloodlust": "Кровожадность",
  "gender": "Пол",
  "m": "Мужской",
  "f": "Женский",
  "n": "Средний",
  "number": "Число",
  "plural": "Множественное",
  "singular": "Единственное",
  "rating_experience": "Опыта",
  "rating_level": "Уровней",
  "rating_locations": "Локаций",
  "rating_skills": "Навыков",
  "wrestling": "Борьба",
  "throwing_weapon": "Метательное",
  "implant": "Протез",
  "medicine": "Медицина",
  "injury_hand": "Травма руки",
  "injury_leg": "Травма ноги",
  "passive": "Пассивное",
  "buff": "Усиление",
  "effects": "Эффекты",
  "Attack_ability": "Атакующее",
  "charges": "Заряды",
  "skill_requirement": "Требования навыка",
  "damage_multiplicator": "Увеличение урона",
  "targets": "Цели",
  "active_magic_slots": "Осталось заклинаний",
  "buff_type": "Тип усиления",
  "weapon": "Оружия",
  "distance": "Расстояние",
  "cost": "Стоимость ОД",
  "magic_type": "Тип магии",
  "Mage": "Маг",
  "Priest": "Жрец",
  "damage_type": "Тип урона",
  "life": "Жизнь",
  "death": "Смерть",
  "associated_skills": "Влияющие навыки",
  "power": "Власть",
  "attack": "Атакующее",
  "secondary_weapon": "Запасное оружие",
  "level": "Уровень",
  "move_cost": "Стоимость перемещения",
  "prefix_damage_type": "Тип урона зачарования",
  "prefix_damage": "Урон зачарования оружия",
  "Fargos-downtown-instructor": "У инструктора",
  "current_weight": "🏋",
  "experience": "Опыт",
  "money": "Монеты",
  "melee_attack": "Атака в ближнем бою",
  "melee_damage": "Урон в ближнем бою",
  "range_attack": "Атака в дальнем бою",
  "range_damage": "Урон в дальнем бою",
  "action_points": "🏃",
  "free_attribute_points": "Свободные очки атрибутов",
  "Race": "Раса",
  "Character_class": "Класс",
  "magic_resist": "Маг. сопротивление",
  "discount": "Скидка",
  "points_per_level": "Очки навыков за уровень",
  "free_skill_points": "Свободные очки навыков",
  "free_talent_points": "Свободные очки талантов",
  "max_party_size": "Максимальный размер группы",
  "move_OP": "Доп. очки передвижения",
  "location": "Локация",
  "duration": "Длительность эффекта",
  "end_time": "Окончание эффекта",
  "Yes": "Да",
  "goods": "Товары",
  "twohanded": "Двуручное",
  "Dungeon_Stone": "🏔Кристаллические горы",
  "Dungeon_Ice": "❄Студёный престол",
  "Dungeon_Electricity": "⚡Грозовой перевал",
  "Dungeon_Light": "🌝Цитадель света",
  "Dungeon_Death": "💀Некрополь",
  "Dungeon_Fire": "🔥Огненные озёра",
  "Dungeon_Dark": "🌚Цитадель тьмы",
  "Dungeon_Life": "🌿Сердце Цветения",
  "Dungeon_Wind": "💨Штормовой грот",
  "Dungeon_Sound": "🌀Пещеры эха",
  "Dungeon_Power": "👑Чертог власти",
  "Tavern": "🍺Таверна",
  "Canalisation_rat_king": "⛓️Плен у крыс",
  "Castle_Stone": "Замок Камня",
  "Castle_Ice": "Замок Льда",
  "Castle_Electricity": "Замок Молнии",
  "Castle_Light": "Замок Света",
  "Castle_Death": "Замок Смерти",
  "Castle_Fire": "Замок Огня",
  "Castle_Dark": "Замок Тьмы",
  "Castle_Life": "Замок Жизни",
  "Castle_Wind": "Замок Ветра",
  "Castle_Sound": "Замок Звука",
  "Castle_Power": "Замок Власти",
  "push": "Отталкивание",
  "Additional damage": "Доп. урон в 1 ходу",
  "suffix": "Суффикс",
  "turns": "Ходы",
  "undefined": "свойства не раскрыты",
  "Fargos-downtown": "Нижний город Фаргоса",
  "Fargos-uptown": "Верхний город Фаргоса",
  "West_wildlands": "Западные Дикие Земли",
  "monet": "Монет",
  "bleed": "Кровотечение",
  "poison": "Отравление",
  "power_deduction": "Вычет Власти",
  "light": "Световой",
  "dark": "Тёмный",
  "stone": "Дробящий",
  "prefix_skill": "Знак зачарования",
  "prefix": "Зачарование",
  "ressurect": "Воскрешение",
  "regeneration": "Регенерация",
  "Wild_lands_coast": "🏝️Побережье",
  "Wild_lands_steppe": "🏜️Степь",
  "Wild_lands_forest": "🌲Лес",
  "Wild_lands_mountains": "⛰️Горы",
  "corrupted": "Проклят",
  "vampirism": "Вампиризм",
  "range": "Дальность",
  "summon": "Призыв",
  "ability": "Умение",
  "enchant_skill1": "Влияющий навык",
  "enchant_skill2": "Влияющий навык",
  "check": "Проверка атрибута",
  "attribute": "Характеристика",
  "difficulty": "Сложность проверки",
  "failure": "Провал",
  "Fargos-downtown-canalisation": "🕳Канализация",
  "Fargos-downtown-gardens": "🌷Сады Фаргоса",
  "Fargos-uptown-tavern": "🍷Таверна Верхнего города",
  "Fargos-downtown-tavern": "🍺Таверна Нижнего города",
  "Fargos-downtown-market": "💰Рынок Нижнего города",
  "Fargos-downtown-towngates": "⛩️Городские ворота Фаргоса",
  "Fargos-downtown-slums": "⚓Портовый район Нижнего города",
  "Fargos-downtown-artisans": "🔨Ремесленный район Нижнего города",
  "Archery_place": "🏹Стрельбище",
  "rating_levels": "Уровней",
  "aura": "Сфера",
  "is_alive": "Жив",
  "Canalisation": "🕳Канализация",
  "level_scale": "Масштабируемый предмет",
  "improve": "Аугментации",
  "daleon": "Далеон",
  "magic_slots": "Применения заклинаний",
  "current_defence": "Класс защиты",
  "additional_attack": "Доп.ы точность",
  "eon_curse": "Проклятие Эона",
  "additional_damage": "Доп. урон",
  "reset_character": "Обновление персонажа",
  "Necropolis_necromancer": "Логово некроманта",
  "scrolls": "Свитки",
  "description": "Описание",
}


export const abilities_descriptions = {
  "Призыв куклы": "Усиление атаки, призывает куклу колдуна после применения, 1 заряд до отдыха",
  "Волна звука": "Усиление атаки, бьющее по 2 целям и наносящее дополнительный урон звуком, 2 заряда до отдыха",
  "Шаровая молния": "Усиление атаки, бьющее по 2 целям и наносящее дополнительный урон электричеством, 2 заряда до отдыха",
  "Морозное дыхание": "Усиление атаки, бьющее по 2 целям и наносящее дополнительный урон холодом, 2 заряда до отдыха",
  "Сопротивление стихиям": "Умение усиления, увеличивающее сопротивление стихиям, стоимость применения 2 ОД, 1 заряд до отдыха",
  "Призыв тени": "Усиление атаки, призывает тень после применения, 3 заряда до отдыха",
  "Всплеск действий": "Умение усиления, увеличивающее запас очков действий на 10, стоимость применения 2 ОД, 1 заряд до отдыха",
  "Призыв нежити": "Усиление атаки, призывает нежить после применения, 1 заряд до отдыха",
  "Порыв ветра": "Усиление атаки, отталкивает противника на 6 клеток, 3 заряда до отдыха",
  "Удар вампира": "Усиление атаки, восстанавливающая атакующему половину нанесённого урона, 3 заряда до отдыха",
  "Призыв существа": "Усиление атаки, призывает случайное существо после применения, 1 заряд до отдыха",
  "Скорбь": "Усиление атаки, снижающее ОД противника на 10 при провале броска харизмы со сложностью 20, 1 заряд до отдыха",
  "Призыв дендроида": "Усиление атаки, призывает дендроидп после применения, 1 заряд до отдыха",
  "Поиск жертвы": "Увеличивает шанс на нахождение искателя приключений в 4 раза.\nЕсли вы побеждаете противника с таким же амулетом - вы забираете у него случайный предмет"
}

export const attributes_dict = {"perception": "Восприятие", "strength": "Сила", "agility": "Ловкость",
"constitution": "Выносливость", "intelligence": "Интеллект", "charisma": "Харизма",
"wisdom": "Мудрость", "luck": "Удача"}

export const RESOURCE_CODES = {
    "112": { name: "Железная руда", icon: "fa-mountain" },
    "114": { name: "Бревно", icon: "fa-tree" },
    "115": { name: "Мешок угля", icon: "fa-coal" },
    "116": { name: "Песчаник", icon: "fa-hill-rockslide" },
    "117": { name: "Мешок песка", icon: "fa-filter" },
    "118": { name: "Стекло", icon: "fa-wine-glass" },
    "119": { name: "Доска", icon: "fa-border-all" },
    "120": { name: "Сталь", icon: "fa-industry" },
    "121": { name: "Каменный блок", icon: "fa-cube" },
    "essence": { name: "Воплощение", icon: "fa-heart" },
    "leather_t1": { name: "Кожа Т1", icon: "fa-leather" },
    "leather_t2": { name: "Кожа Т2", icon: "fa-leather" },
    "leather_t3": { name: "Кожа Т3", icon: "fa-leather" },
};

export const SETTLEMENT_TYPES = {
    "death": "Смерть",
    "fire": "Огонь",
    "water": "Вода",
    "earth": "Земля",
    "air": "Воздух",
    "lighting": "Молния"
};

export const BUILDING_ACTIONS = {
    "build": "Построить/Улучшить",
    "repair": "Ремонтировать",
    "hire": "Нанять юнитов",
    "ritual": "Провести ритуал",
    "storage": "Управление складом"
};

export const talents_dict = {
  "Живучесть": {
      "requirements": {
          "constitution": [10, 14, 18]
      },
      "take_times": 3,
      "effects": "+1 максимальное здоровье за уровень",

  },
  "Второе дыхание": {
      "requirements": {
          "constitution": [12, 15]
      },
      "take_times": 2,
      "effects": "Открывает применение умения второе дыхание",

  },
  "Эрудит": {
      "requirements": {
          "intelligence": [10, 14, 18],
      },
      "take_times": 3,
      "effects": "+2 очка навыков за уровень",

  },
  "Хорошая память": {
      "requirements": {
          "wisdom": 12
      },
      "take_times": 100,
      "effects": "+1 слот заклинаний",

  },
  "Изучение магии": {
      "requirements": {
          "wisdom": 10,
          "intelligence": 10,
      },
      "take_times": 100,
      "effects": "Первый раз - открывает возможность изучения 1 элемента и 1 типа воздействия, дальше - по 1 знаку",

  },
  "Эксперт по знакам": {
      "requirements": {
          "wisdom": 20,
          "intelligence": 20,
      },
      "take_times": 1,
      "effects": "При переносе знака даёт шанс 5% на создание 2 знаков (потратятся 2 материала)",

  },
  "Стрельба в упор": {
      "requirements": {
          "perception": 12
      },
      "take_times": 1,
      "effects": "Даёт возможность стрельбы из дальнего оружия в упор",

  },
  "Быстрые рефлексы": {
      "requirements": {
          "perception": 12
      },
      "take_times": 100,
      "effects": "Инициатива + 1",

  },
  "Быстрые ноги": {
      "requirements": {
          "agility": [12, 15]
      },
      "take_times": 2,
      "effects": "Даёт возможность бесплатного передвижения на 1 шаг каждый раунд",

  },
  "Харизматичный лидер": {
      "requirements": {
          "charisma": [10, 14, 18],
      },
      "take_times": 3,
      "effects": "Максимальный размер группы + 1",

  },
  "Решительный лидер": {
      "requirements": {
          "charisma": [12, 15]
      },
      "take_times": 2,
      "effects": "Броски на попадания членов группы +1",

  },
  "Тяжёлая рука": {
      "requirements": {
          "strength": 12
      },
      "take_times": 1,
      "effects": "Урон в ближнем бою +1",

  },
  "Крепкая спина": {
      "requirements": {
          "strength": 12
      },
      "take_times": 100,
      "effects": "Максимальный переносимый вес + 50",

  },
  "Ещё больше критических попаданий": {
      "requirements": {
          "luck": [10, 12, 15, 20, 25]
      },
      "take_times": 5,
      "effects": "Шанс Крита + 1",

  },
  "Любимец фортуны": {
      "requirements": {
          "luck": 12
      },
      "take_times": 100,
      "effects": "Шанс получения добычи + 5%",

  },
  "Обоерукий": {
      "requirements": {
          "strength": 16,
          "agility": 16,
          "Character_class": ["Варвар"],
      },
      "take_times": 1,
      "effects": "Позволяет наносить удары запасным оружием со 100% уроном, если левая рука - пустая.",
  },
  "Берсерк": {
      "requirements": {
          "strength": 16,
          "constitution": 16,
          "Character_class": ["Варвар"],
      },
      "take_times": 1,
      "effects": "С каждым ударом вы наносите дополнительный урон в зависимости от вашего недостающего здоровья",
  },
  "Прочность": {
      "requirements": {
          "wisdom": 16,
          "constitution": 16,
          "Character_class": ["Страж", "Адепт Камня"],
      },
      "take_times": 1,
      "effects": "У вас есть шанс 15% проигнорировать урон от противника",
  },
  "Прячься за меня": {
      "requirements": {
          "strength": 16,
          "constitution": 16,
          "Character_class": ["Страж"],
      },
      "take_times": 1,
      "effects": "Прячься за меня: Противник, который может выбирать цель между стражем и любой другой целью, всегда выбирает стража. Полученный урон накапливается 1 к 10. При нанесении урона накопленный урон добавляется к нему. Требования: Сила 16, Выносливость 16",
  },
  "Матёрый вояка": {
      "requirements": {
          "strength": 16,
          "agility": 16,
          "Character_class": ["Мастер битвы"],
      },
      "take_times": 1,
      "effects": "Позволяет Поместить двуручное оружие в запас.",
  },
  "Воинская удача": {
      "requirements": {
          "constitution": 16,
          "luck": 16,
          "Character_class": ["Мастер битвы"],
      },
      "take_times": 1,
      "effects": "При получении критического удара, шанс 3*модификатор удачи на то, что этот удар станет обычным.",
  },
  "Карающий клинок": {
      "requirements": {
          "strength": 16,
          "wisdom": 16,
          "Character_class": ["Паладин"],
      },
      "take_times": 1,
      "effects": "Цели ваших атак получают дополнительный урон доступным вам элементом (Свет, Тьма, Жизнь). Трата ячеек происходит в момент атаки. Урон зависит от мудрости и прокачки элемента",
  },
  "Благословение эонов: Астрион": {
      "requirements": {
          "charisma": 16,
          "wisdom": 16,
          "Character_class": ["Паладин", "Жрец Света"],
      },
      "take_times": 1,
      "effects": "Благосклонность вашего выбранного эона усиливает ваши молитвы Света на 1% за 10 благосклонности",
  },
  "Благословение эонов: Малгорот": {
      "requirements": {
          "charisma": 16,
          "wisdom": 16,
          "Character_class": ["Паладин", "Жрец Тьмы"],
      },
      "take_times": 1,
      "effects": "Благосклонность вашего выбранного эона усиливает ваши молитвы Тьмы на 1% за 10 благосклонности",
  },
  "Благословение эонов: Вирдан": {
      "requirements": {
          "charisma": 16,
          "wisdom": 16,
          "Character_class": ["Паладин", "Жрец Жизни"],
      },
      "take_times": 1,
      "effects": "Благосклонность вашего выбранного эона усиливает ваши молитвы Жизни на 1% за 10 благосклонности",
  },
  "Благословение эонов: Морвинкар": {
      "requirements": {
          "charisma": 16,
          "wisdom": 16,
          "Character_class": ["Жрец Смерти"],
      },
      "take_times": 1,
      "effects": "Благосклонность вашего выбранного эона усиливает ваши молитвы Смерти на 1% за 10 благосклонности",
  },
  "Поднятие мёртвых": {
      "requirements": {
          "intelligence": 16,
          "wisdom": 16,
          "Character_class": ["Жрец Смерти"],
      },
      "take_times": 1,
      "effects": "Поверженные жрецом Смерти противники встают в виде его временных союзников",
  },
  "Увёртливость": {
      "requirements": {
          "intelligence": 16,
          "agility": 16,
          "Character_class": ["Расхититель"],
      },
      "take_times": 1,
      "effects": "Вы игнорируете атаки по возможности (удар при разрыве дистанции с противником)",
  },
  "Преимущество в дистанции": {
      "requirements": {
          "perception": 16,
          "agility": 16,
          "Character_class": ["Расхититель"],
      },
      "take_times": 1,
      "effects": "+5% урона за каждый метр между вами и вашим противником",
  },
  "Знание слабых мест": {
      "requirements": {
          "strength": 16,
          "agility": 16,
          "Character_class": ["Убийца"],
      },
      "take_times": 1,
      "effects": "Ваши критические удары наносят 250% урона вместо 200%",
  },
  "Внезапный удар": {
      "requirements": {
          "perception": 16,
          "agility": 16,
          "Character_class": ["Убийца"],
      },
      "take_times": 1,
      "effects": "100% шанс критического удара по целям с полным запасом здоровья",
  },
  "Пивка для рывка": {
      "requirements": {
          "intelligence": 16,
          "constitution": 16,
          "Character_class": ["Алхимик"],
      },
      "take_times": 1,
      "effects": "После применения зелья вы восстанавливаете 20% здоровья, +2 к меткости броска зелий",
  },
  "Путь совершенства": {
      "requirements": {
          "agility": 16,
          "perception": 16,
          "Character_class": ["Монах"],
      },
      "take_times": 1,
      "effects": "Вы можете накопить при безоружной атаке заряд умения Град ударов с шансом 15%.",
  },
  "Ци": {
      "requirements": {
          "intelligence": 16,
          "perception": 16,
          "Character_class": ["Монах"],
      },
      "take_times": 1,
      "effects": "Каждая ваша безоружная атака имеет шанс заставить ваши внутренние силы проявить себя в виде стихийного урона (в том числе и урон смерти, власти, тьмы и света) с шансом 30%.",
  },
  "Вдохновение": {
      "requirements": {
          "agility": 16,
          "luck": 16,
          "Character_class": ["Бард"],
      },
      "take_times": 1,
      "effects": "Даёт использовать умение бардовское вдохновение - за 2 ОД повышает од цели на мод харизмы / 2 + 1.",
  },
  "Широкая душа": {
      "requirements": {
          "charisma": 16,
          "luck": 16,
          "Character_class": ["Бард"],
      },
      "take_times": 1,
      "effects": "Увеличивает число спутников на 2, снижает шансы на то, что спутник вас покинет в 2 раза.",
  },
  "Секретный компонент": {
      "requirements": {
          "agility": 16,
          "strength": 16,
          "Character_class": ["Алхимик"],
      },
      "take_times": 1,
      "effects": "+10% урона за каждое недостающее зелье на поясе (максимум зелий - текущее доступное число)",
  },
  "Из пепла": {
      "requirements": {
          "constitution": 16,
          "intelligence": 16,
          "Character_class": ["Адепт Огня"],
      },
      "take_times": 1,
      "effects": "+1 воскрешение",
  },
  "Мощные заклинания: Огонь": {
      "requirements": {
          "wisdom": 16,
          "intelligence": 16,
          "Character_class": ["Адепт Огня"],
      },
      "take_times": 1,
      "effects": "Игнорирование 50% сопротивления к Огню",
  },
  "Криостазис": {
      "requirements": {
          "constitution": 16,
          "intelligence": 16,
          "Character_class": ["Адепт Льда"],
      },
      "take_times": 1,
      "effects": "Если здоровье больше 1, то удар опустит здоровье до 1 вместо того, чтобы убить вас",
  },
  "Мощные заклинания: Лёд": {
      "requirements": {
          "wisdom": 16,
          "intelligence": 16,
          "Character_class": ["Адепт Льда"],
      },
      "take_times": 1,
      "effects": "Игнорирование 50% сопротивления ко Льду",
  },
  "Молния": {
      "requirements": {
          "perception": 16,
          "intelligence": 16,
          "Character_class": ["Адепт Молнии"],
      },
      "take_times": 1,
      "effects": "В конце вашего хода в случайного врага ударяет молния",
  },
  "Мощные заклинания: Молния": {
      "requirements": {
          "wisdom": 16,
          "intelligence": 16,
          "Character_class": ["Адепт Молнии"],
      },
      "take_times": 1,
      "effects": "Игнорирование 50% сопротивления к Молнии",
  },
  "Каменная ловушка": {
      "requirements": {
          "wisdom": 16,
          "intelligence": 16,
          "Character_class": ["Адепт Камня"],
      },
      "take_times": 1,
      "effects": "10% шанс поставить на противника метку на 2 хода, увеличивающую по нему урон на 50% при нанесении адептом камня дробящего урона",
  },
  "Боль в суставах": {
      "requirements": {
          "perception": 16,
          "intelligence": 16,
          "Character_class": ["Адепт Ветра"],
      },
      "take_times": 1,
      "effects": "При вынужденном перемещении от заклинаний ветра противники получают урон в зависимости от вашего интеллекта",
  },
  "Мощные заклинания: Ветер": {
      "requirements": {
          "wisdom": 16,
          "intelligence": 16,
          "Character_class": ["Адепт Ветра"],
      },
      "take_times": 1,
      "effects": "Игнорирование 50% сопротивления к Ветру",
  },
  "Громкий товарищ": {
      "requirements": {
          "perception": 16,
          "charisma": 16,
          "Character_class": ["Адепт Звука"],
      },
      "take_times": 1,
      "effects": "В бою к вам присоединяется спутник соответствующий вашему мастерству.",
  },
  "Мощные заклинания: Звук": {
      "requirements": {
          "wisdom": 16,
          "intelligence": 16,
          "Character_class": ["Адепт Звука"],
      },
      "take_times": 1,
      "effects": "Игнорирование 50% сопротивления к Звуку",
  },
  "Абсолютная власть": {
      "requirements": {
          "wisdom": 16,
          "intelligence": 16,
          "Character_class": ["Адепт Власти"],
      },
      "take_times": 1,
      "effects": "Ваш магический урон увеличен на 5",
  },
  "Мощные заклинания: Власть": {
      "requirements": {
          "wisdom": 16,
          "intelligence": 16,
          "Character_class": ["Адепт Власти"],
      },
      "take_times": 1,
      "effects": "Игнорирование 50% сопротивления к Власти",
  },
  "Мощные заклинания: Свет": {
      "requirements": {
          "wisdom": 16,
          "intelligence": 16,
          "Character_class": ["Жрец Света"],
      },
      "take_times": 1,
      "effects": "Игнорирование 50% сопротивления к Свету",
  },
  "Восстановление": {
      "requirements": {
          "wisdom": 16,
          "constitution": 16,
          "Character_class": ["Жрец Жизни"],
      },
      "take_times": 1,
      "effects": "Даёт 5% регенерацию",
  },
  "Густой мрак": {
      "requirements": {
          "wisdom": 16,
          "intelligence": 16,
          "Character_class": ["Жрец Тьмы"],
      },
      "take_times": 1,
      "effects": "Даёт 50 сопротивления магии",
  },

}