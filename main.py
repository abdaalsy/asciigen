from PIL import Image
from time import sleep
import requests, sys, cv2, shelve
import numpy as np
from os import getcwd
from time import localtime
from datetime import date
from subprocess import call

# one char = 8 x 18 px (each pixel is 4:9)

# TODO: make ui, either console UI or window
# TODO: maybe try to get this up and running on the site someday
# TODO: prevent Ctrl+C from terminating the batch job if possible. Maybe just go back to the menu bc itll only ask to terminate once
#       the program is done executing.

def main():
    history_shelf = shelve.open("history")
    while True:
        call("cls", shell=True)
        while True:
            if input("Would you like to access your user data? (y/n): ").lower() == "y":
                access_old(history_shelf)
            else:
                break
        result, is_img = input_handler()    # result is the ascii text. In the case of realtime, it is a list where each element is a frame
        if is_img:
            output(result)
            print(f"\nDone! Check \"{getcwd()}\\output.txt\" for the converted image. Remember to zoom out")
        choice = input("Would you like to save this conversion to access it later? (y/n): ")
        if choice.lower() == "y":
            name = input("What will you call it? ")
            now = localtime()
            time_str = f"{now[3]}:{now[4]}:{now[5]}"
            history_shelf[name] = (result, is_img, str(date.today()), time_str)
            print("Saved!")

mirrored = lambda real : np.array([np.flip(line) for line in real])

def input_handler():
    # Inside this function should only be choices which will convert an image(s) to ascii since it returns that.
    print("\n1. Convert a picture taken from the webcam to text")
    print("2. Convert a local image/gif to text")
    print("3. Convert an image/gif from the web to text")
    print("4. Realtime webcam to text")
    print("Enter nothing to exit.")
    choice = input()
    one_frame = True
    if choice == "2":
        p = input("Enter the filepath: ")
        im = Image.open(p)
        if is_gif(im):
            one_frame = False
            txt = []
            for i in range(0, im.n_frames):
                im.seek(i)
                rgb_im = im.convert("RGB")
                fr = ascii_gen(rgb_im)
                print(fr)
                txt += fr
        else:
            txt = ascii_gen(im)
    elif choice == "3":
        url = input("Enter the URL (right click on the image and click \"Copy Image Link\"): ")
        im = Image.open(web_retrieve(url))
        if is_gif(im):
            one_frame = False
            txt = []
            for i in range(0, im.n_frames):
                im.seek(i)
                rgb_im = im.convert("RGB")
                fr = ascii_gen(rgb_im)
                print(fr)
                txt += fr
        else:
            txt = ascii_gen(im)
    elif choice == "1":
        wc = webcam_capture()
        txt = ascii_gen(Image.fromarray(mirrored(wc)))
    elif choice == "4":
        one_frame = False
        txt = realtime() # realtime returns a list so txt must be a list where each element is a frame in text
    elif choice == "":
        sys.exit()
    return txt, one_frame

def access_old(shlf: shelve.Shelf):
    print("Past conversions:")
    data = [["Name:", "Type:", "Date:", "Time:"]]
    for k in shlf.keys():
        row = [k, "Image" if shlf[k][1] else "Video", shlf[k][2], shlf[k][3]]
        data.append(row)
    col_width = max(len(str(word)) for row in data for word in row) + 2 # the 2 is the distance between each column (padding)
    for row in data:
        print("".join(str(word).ljust(col_width) for word in row))
    print("\nEnter the number for the desired action, or enter nothing to exit")
    print("\t1. Access a past conversion\n\t2. Delete a past conversion")
    choice = input()
    if choice == "":
        return
    elif choice == "1":
        con_name = input("Enter the name of the conversion you want to access: ")
        if not con_name in shlf.keys():
            print("Not found.")
            return
        if not shlf[con_name][1]: # If it is not an image, for realtime capture it will be False.
            video = shlf[con_name][0] # first element is the string, then next elements are time data and shit, see line 31
            for frame in video:
                print(frame)
                sleep((1/30)/2)
                """
                ^ This is a band-aid fix kinda. The problem is that I know the framerate of my webcam, but I don't know how long
                it takes to print to the screen. Had I known, I could sleep for less time to compensate. I heard about using
                IPython to find it out, but I'm not sure how to use it. For now, sleeping for 1/60 second seems to work good enough
                even though my webcam's framerate is 30fps.
                """
            return
        else:
            output(shlf[con_name][0], fname=f"{con_name}.txt")
            print(f"Done! Check \"{getcwd()}\\{con_name}.txt\"")
            return
    elif choice == "2":
        name = input("Enter the name of the conversion you would like to delete: ")
        try: 
            del shlf[name]
            print("Deleted")
        except KeyError:
            print("Could not find this key, did you type the name correctly?")

def realtime():
    all_txt = []
    vid = cv2.VideoCapture(0)
    print("Connected to webcam, Ctrl+C to stop. Starting in:")
    print("3")
    sleep(1)
    print("2")
    sleep(1)
    print("1")
    sleep(1)
    try:
        while True:
            ret, frame = vid.read()
            if not ret:
                print("the latest frame could not be retrieved")
                break
            txt = ascii_gen(Image.fromarray(mirrored(frame)), 64)
            print(txt)
            all_txt.append(txt)
    except KeyboardInterrupt:
        print("Realtime capture stopped")
    return all_txt

def is_gif(img: Image):
    try:
        img.is_animated
    except AttributeError:
        return False
    return True

def webcam_capture():
    print("Attempting to access the webcam.....")
    vid = cv2.VideoCapture(0)
    print("Connected to webcam, press space to save the current frame.")
    while True:
        ret, frame = vid.read()
        if not ret:
            return None
        cv2.imshow("Webcam", frame)
        if cv2.waitKey(1) & 0xFF == ord(" "):
            break
    vid.release()
    cv2.destroyAllWindows()
    return frame

def web_retrieve(url: str):
    res = requests.get(url, allow_redirects=True)
    ct = res.headers.get("Content-Type").split('/')
    if ct[0] != "image":
        print("The link you entered does not lead to an image.")
        sleep(3)
        sys.exit()
    ext = ct[1]
    f = open(f"image.{ext}", "wb")
    f.write(res.content)
    f.close()
    return f"image.{ext}"

def ascii_gen(img: Image, width=100):
    n_width = width
    n_height = int(n_width * (img.size[1] / img.size[0]))
    img = img.resize((n_width, n_height))

    ASCII_CHARS = ["@", "#", "$", "%", "?", "*", "+", ";", ":", ",", "."]
    ASCII_CHARS.reverse()

    ascii_all = ""
    for pix in img.getdata():
        r, g, b = pix[0], pix[1], pix[2]
        lum = int((0.2126 * r + 0.7152 * g + 0.0722 * b))
        ascii_all += ASCII_CHARS[lum//25]*2     # using same character twice to compensate narrowing caused by line spacing
    
    line_width = n_width*2 
    ascii_str = ""
    for i in range(0, len(ascii_all), line_width):
        ascii_str += ascii_all[i:i+line_width] + "\n"

    return ascii_str

def output(s, fname="output.txt"):
    with open(fname, "w") as f:
        f.write(s)
        f.close()

if __name__ == "__main__":
    main()