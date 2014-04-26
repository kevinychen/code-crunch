s = raw_input().strip().split(' ')

S = set()

def recur(st, ind):
    if ind == 5:
        S.add(eval(st))
        return
    for sy in '-+*':
        recur(st + sy + s[ind], ind + 1)

recur(s[0], 1)
print len(S)
