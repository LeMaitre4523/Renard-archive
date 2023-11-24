//
//  ContentView.swift
//  PapillonWatch Watch App
//
//  Created by Tom Theret on 19/10/2023.
//

import SwiftUI

struct ContentView: View {
  
  @ObservedObject var phoneConnector = PhoneConnector()
  @State var stack = [Int]()
  
  
    var body: some View {
      
      
        NavigationView {
          if phoneConnector.receivedEvents.isEmpty {
            Text("Pas le cours pour aujourd'hui !")
              .navigationBarTitle("Papillon")
              .toolbar {
                  ToolbarItem(placement: .topBarTrailing) {
                    NavigationLink {
                      HomeworkView(phoneConnector: phoneConnector)
                    } label: {
                        Label("Devoirs", systemImage: "book")
                    }
                  }
              }
          } else {
            List {
              ForEach(phoneConnector.receivedEvents) { event in
                VStack(alignment: .leading) {
                  if event.is_cancelled == true {
                    Group {
                      Text("ⓘ Annulé")
                        .bold()
                        .textCase(.uppercase)
                        .padding(.horizontal)
                        .padding(.vertical, 2.5)
                        .background(Color.red)
                        .cornerRadius(5)
                    }
                    .padding(.top, 3)
                    
                    
                  } else {
                    Text("\(event.start, style: .time)")
                  }
                    
                    Text(event.subject)
                        .font(.headline)
                        .lineLimit(2)
                    Text("\(event.teacher)")
                    Text("salle \(event.room)")
                  
                }
                .listRowPlatterColor(Color(hex: event.background_color).opacity(0.35))
              }.listStyle(.carousel)
                
                
            }
            .navigationBarTitle("EDT")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                  NavigationLink {
                    HomeworkView(phoneConnector: phoneConnector)
                  }label: {
                      Label("Devoirs", systemImage: "book")
                  }
                }
            }
          }
            
            
          
        }
        
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}

//MARK: - Convertisseur HEX vers Color
extension Color {
  init(hex: String) {
    var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")
    var rgb: UInt64 = 0
    Scanner(string: hexSanitized).scanHexInt64(&rgb)
    let red = Double((rgb & 0xFF0000) >> 16) / 255.0
    let green = Double((rgb & 0x00FF00) >> 8) / 255.0
    let blue = Double(rgb & 0x0000FF) / 255.0
    self.init(red: red, green: green, blue: blue)
  }
}

