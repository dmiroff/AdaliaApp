import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE=os.environ.get('HOME_STORAGE_QA_URL','http://127.0.0.1:8879')
BUILD=Path(os.environ.get('HOME_STORAGE_QA_BUILD',Path(__file__).resolve().parents[2]/'build'))
OUT=Path(os.environ.get('HOME_STORAGE_QA_OUTPUT','/tmp/home-storage-qa'));OUT.mkdir(exist_ok=True,parents=True)
items=[dict(id=str(i),name=f'Реагент {i}',type='reagent',count=5,available=5,equipped=0,weight=.2) for i in range(1,121)]
items.append(dict(id='416',name='Эссенция призрака',type='reagent',count=5,available=5,equipped=0,weight=.2))
items.append(dict(id='900',name='Берёзовое бревно',type='reagent',count=3,available=3,equipped=0,weight=2))
state=dict(inventory=items,storage=items.copy(),storage_weight=50,capacity=1000,inventory_weight=50,max_weight=1000,revision='a'*64,blocked_reason=None)
transfers=[]

def handle(route):
 path=route.request.url.split('/api/',1)[1]
 if path=='verify':body={'valid':True}
 elif path=='player':body={'status':'success','data':dict(id=991001,name='Проверка',inventory_new={},max_weight=1000,current_weight=0,level=1,money=0,health=100,current_health=100,max_health=100)}
 elif path=='home-storage':body=state
 elif path=='home-storage/transfer':
  sent=route.request.post_data_json;transfers.append(sent)
  body={**state,'revision':'b'*64,'moved':[dict(name='Эссенция призрака',quantity=2)],'message':('Предметы забраны из домашнего хранилища' if sent['direction']=='withdraw' else 'Предметы сложены в домашнее хранилище')+':\n• Эссенция призрака × 2'}
 else:body={}
 route.fulfill(status=200,content_type='application/json',body=json.dumps(body,ensure_ascii=False))

with sync_playwright() as p:
 browser=p.chromium.launch(**({'executable_path':os.environ['HOME_STORAGE_QA_CHROME']} if os.environ.get('HOME_STORAGE_QA_CHROME') else {}))
 for width in (390,1365):
  page=browser.new_page(viewport={'width':width,'height':900})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/api/**',handle)
  page.route(BASE+'/inventory',lambda r:r.fulfill(content_type='text/html',body=(BUILD/'index.html').read_text()))
  page.add_init_script("localStorage.setItem('id','991001');localStorage.setItem('access_token','fixture');")
  page.goto(BASE+'/inventory')
  page.get_by_role('button',name='🏠 Домашнее хранилище',exact=True).click()
  section=page.get_by_role('region',name='Домашнее хранилище')
  section.get_by_role('button',name='Забрать из сундука',exact=True).click()
  search=section.get_by_label('Поиск предметов',exact=True)
  expect(search).to_be_visible()
  search.fill('  БЕРЕЗОВОЕ   ')
  expect(section.get_by_role('checkbox')).to_have_count(1)
  expect(section.get_by_role('checkbox',name='Берёзовое бревно',exact=True)).to_be_visible()
  section.get_by_role('button',name='Очистить поиск',exact=True).click()
  expect(section.get_by_role('checkbox')).to_have_count(122)
  search.fill('эссенция')
  section.get_by_role('checkbox',name='Эссенция призрака',exact=True).check()
  section.get_by_label('Количество: Эссенция призрака',exact=True).fill('2')
  search.fill('БЕРЕЗОВОЕ')
  expect(section.get_by_text('Выбрано: 1',exact=False)).to_be_visible()
  search.fill('эссенция')
  section.get_by_role('button',name='Забрать выбранное',exact=True).click()
  page.get_by_role('dialog').get_by_role('button',name='Подтвердить перенос',exact=True).click()
  alert=section.get_by_role('alert')
  expect(alert).to_contain_text('Эссенция призрака × 2')
  page.locator('.modal').wait_for(state='detached')
  expect(alert).to_be_in_viewport()
  page.wait_for_function("document.querySelector('.home-storage-receipt').getBoundingClientRect().top >= 70")
  assert transfers[-1]['items']==[{'item_id':'416','quantity':2}]
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
  page.screenshot(path=str(OUT/f'home-{width}.png'),full_page=True)
  state['blocked_reason']='Вернитесь домой в игре, чтобы пользоваться хранилищем'
  section.get_by_role('button',name='Обновить',exact=True).click()
  expect(section.get_by_role('alert').filter(has_text='Вернитесь домой')).to_be_visible()
  search.fill('Березовое')
  expect(section.get_by_role('checkbox')).to_have_count(1)
  expect(section.get_by_role('checkbox',name='Берёзовое бревно',exact=True)).to_be_disabled()
  assert not errors,errors
  state['blocked_reason']=None
  page.close()
 browser.close()
print('PASS mobile + desktop: visible search, е/ё + whitespace, 122 stacks, selection retained, exact transfer, visible receipt, browsing outside home, no overflow or JS errors')
