import functools, http.server, pathlib, sys, threading
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent.parent/'.tools/orbit-test'))
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parent
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    page=browser.new_page(viewport={'width':1440,'height':900})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(f'http://127.0.0.1:{server.server_port}',wait_until='networkidle')
    page.wait_for_function('typeof window.driveState === "function"')
    state=lambda:page.evaluate('driveState()')
    assert page.locator('#overlay').is_hidden()
    assert state()['modelSource']=='Blender 4.5', state()
    dims=state()['modelBounds'];assert 1.8<dims[0]<2.5 and 1<dims[1]<2 and 4<dims[2]<5, dims
    initial=state()
    page.keyboard.down('a');page.wait_for_function('Math.abs(driveState().wheelAngle) > .60');page.keyboard.up('a')
    assert .59 < state()['wheelAngle'] < .64, state()
    assert state()['heading']==initial['heading'], state()
    page.keyboard.down('d');page.wait_for_function('driveState().wheelAngle < -.60');page.keyboard.up('d')
    assert -.64 < state()['wheelAngle'] < -.59, state()
    page.wait_for_function('Math.abs(driveState().wheelAngle) < .02');assert abs(state()['wheelAngle'])<.02, state()
    page.keyboard.down('w'); page.wait_for_function('driveState().speed > 8'); page.keyboard.up('w')
    assert state()['speed']>2 and state()['z']>12 and state()['wheelRoll']>0, state()
    before_turn=state()['heading']
    page.keyboard.down('d');page.wait_for_function('driveState().heading < -0.45');page.keyboard.up('d')
    assert state()['heading']<before_turn-.12,state()
    page.keyboard.press('p'); frozen=state();page.wait_for_timeout(250)
    assert state()['paused'] and state()['x']==frozen['x'] and state()['lapTime']==frozen['lapTime']
    page.locator('#resume').click();assert not state()['paused']
    page.keyboard.press('c');assert state()['camMode']==1
    page.keyboard.press('r');assert state()['speed']==0 and state()['z']==12 and state()['lap']==1
    roll_before_reverse=state()['wheelRoll']
    page.keyboard.down('s');page.wait_for_function('driveState().speed < -2');page.keyboard.up('s');assert state()['speed']<0
    assert state()['wheelRoll'] < roll_before_reverse
    page.keyboard.press('r');page.keyboard.press('c')
    page.wait_for_timeout(600)
    output=root/'test-results';output.mkdir(exist_ok=True)
    page.screenshot(path=str(output/'desktop.png'))
    page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(400)
    assert page.evaluate('document.documentElement.scrollWidth===innerWidth')
    gas=page.locator('[data-control="gas"]');gas.dispatch_event('pointerdown',{'pointerId':1})
    page.wait_for_function('driveState().speed > 2');gas.dispatch_event('pointerup',{'pointerId':1})
    assert state()['speed']>0
    page.keyboard.press('r');page.screenshot(path=str(output/'mobile.png'))
    page.evaluate("window.dispatchEvent(new Event('blur'))");assert state()['paused']
    assert not errors, errors
    browser.close()
server.shutdown()
print('PASS: WebGL, acceleration, steering, reverse, pause, reset, camera, mobile controls, blur pause')
