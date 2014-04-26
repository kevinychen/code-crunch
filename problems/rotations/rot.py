def rotR(s):
    return s[-1] + s[:-1]

def rotL(s):
    return s[1:] + s[0]

def stripZeroes(s):
    return str(int(s))

s = raw_input()

D = set()

maxi = -1

def recur(st):
    global maxi
    if st in D:
        return
    D.add(st)

    left = stripZeroes(rotL(st))
    right = stripZeroes(rotR(st))

    if int(left) > maxi:
        maxi = int(left)
    if int(right) > maxi:
        maxi = int(right)

    recur(left)
    recur(right)

recur(s)

print maxi
