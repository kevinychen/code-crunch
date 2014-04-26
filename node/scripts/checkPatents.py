# This script finds duplicate patent substrings in all submissions
#   of the form submissions/t_[username]

import glob
import os
import re

# length of a patent substring
N = 10

# whitelisted substrings
whitelist = [
  '#include <[^<>]>',
  'using namespace std;',
  'int main\(\) {',
  'import java\.[A-Za-z]+\.\*;',
  'public class Main {',
  'public static void main\(String\[\] args\) throws IOException {'
  'import [A-Za-z]+',
  ]

# blacklisted substrings
blacklist = [
  '#define',
  ]

whitelist = set(map(lambda x: re.compile(x), whitelist))
blacklist = set(map(lambda x: re.compile(x), blacklist))

# map from substring to list of all (user, position) occurrences
invalids = {}

for file in glob.glob('submissions/t_*'):
  filename = os.path.basename(file)
  with open(file) as fh:
    data = fh.read()
    for s in whitelist:
      data = re.sub(s, r'', data)
    for i in xrange(len(data) - N):
      s = data[i:i+N]
      if s in invalids:
        if len(invalids[s]) == 1:  # need to output
          print s.replace('\n', "\\n")
        invalids[s].append((filename, i))
      else:
        invalids[s] = [(filename, i)]
